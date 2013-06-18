define([
    "chai",
    "underscore",
    "fossil/application",
    "fossil/module",
    "fossil/factory",
], function (chai, _, Application, Module, Factory) {

    var assert = chai.assert;

    describe('Fossil.Application configuration', function () {
        it('should be possible to give modules as options', function() {
            var Module1 = Module.extend({});
            var Module2 = Module.extend({});
            var application = new Application({
                modules: {
                    '': Module1,
                    'foo': Module2
                }
            });

            assert.equal(_.size(application.getModule()), 2, 'It is possible to access all applicaitons at once');
            assert.instanceOf(application.getModule(""), Module1, 'Applicaiton key can be empty');
            assert.instanceOf(application.getModule("foo"), Module2, 'Applicaiton key can contain letters');
        });

        it('should be possible to register events as options', function(done) {
            this.timeout(10);
            done = _.after(2, done);
            var Application1 = Application.extend({
                bar: function () {
                    assert.ok('It is possible to define callbacks directly in event hash');
                    done();
                }
            });
            var application = new Application1({
                events: {
                    'foo': function () {
                        assert.ok('It is possible to define callbacks directly in event hash');
                        done();
                    },
                    'bar': 'bar'
                }
            });

            application.trigger('foo');
            application.trigger('bar');
        });
    });

    describe('Fossil.Application can connect module', function () {

        it('should be possible to connect an Module and retrieve it.', function () {
            var application = new Application();
            application.connect('', Module);

            assert.equal(_.size(application.getModule()), 1, 'It is possible to access all applicaitons at once');
            assert.instanceOf(application.getModule(""), Module, 'Registered module is accessible via path key');
        });

        it('should be possible to connect multiple Module-s.', function () {
            var Module1 = Module.extend({});
            var Module2 = Module.extend({});
            var Module3 = Module.extend({});
            var application = new Application();
            application.connect('', Module1);
            application.connect('foo', Module2);
            application.connect('bar/baz', Module3);

            assert.equal(_.size(application.getModule()), 3, 'It is possible to access all applicaitons at once');
            assert.instanceOf(application.getModule(""), Module1, 'Applicaiton key can be empty');
            assert.instanceOf(application.getModule("foo"), Module2, 'Applicaiton key can contain letters');
            assert.instanceOf(application.getModule("bar/baz"), Module3, 'Module key can be a path');
        });

        it('should be possible to connect Module instance', function() {
            var application = new Application();
            application.connect('', new Module(application));

            assert.equal(_.size(application.getModule()), 1, 'It is possible to access all applicaitons at once');
            assert.instanceOf(application.getModule(""), Module, 'Registered module is accessible via path key');
        });

        it('connects module key as path', function () {
            var application = new Application();
            application.connect('foo', Module);

            assert.equal(application.getModule('foo').path, 'foo');
        });
    });

    describe('Fossil.Application can use Factory-s', function () {
        it('should be possible to use a factory and retreive it', function () {
            var application = new Application();
            application.use('foo', new Factory());

            assert.instanceOf(application.factories.foo, Factory);
        });

        it('should be possible to use multiple factories and retreive it', function () {
            var application = new Application();
            var Factory1 = Factory.extend({});
            var Factory2 = Factory.extend({});

            application.use('foo', new Factory1());
            application.use('bar', new Factory2());

            assert.instanceOf(application.factories.foo, Factory1);
            assert.instanceOf(application.factories.bar, Factory2);
        });

        it('should be possible to use an uninstanciated factory', function () {
            var application = new Application();
            application.use('foo', Factory);

            assert.instanceOf(application.factories.foo, Factory);
        });

        it('should be possible to define factories in options', function () {
            var application = new Application({
                factories: {
                    'foo': Factory
                }
            });

            assert.instanceOf(application.factories.foo, Factory);
        });

        it('should activate factory for application when in use', function (done) {
            this.timeout(10);
            var application = new Application();
            var Factory1 = Factory.extend({
                _doActivateApplication: function (_application) {
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            application.use('factory1', Factory1);
        });

        it('should suspend previous factory for application when in use', function (done) {
            this.timeout(10);
            done = _.after(3, done);
            var application = new Application();
            var Factory1 = Factory.extend({
                _doSuspendApplication: function (_application) {
                    assert.strictEqual(application, _application);
                    done();
                }
            });
            var Factory2 = Factory.extend({
                _doActivateApplication: function (_application) {
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            application.use('factory1', Factory1);
            application.use('factory1', Factory2);
            assert.instanceOf(application.factories.factory1, Factory2);
            done();
        });

        it('should trigger a factory:use event when new factory is used', function (done) {
            this.timeout(10);
            var application = new Application();
            var factory = new Factory();
            application.on('factory:use', function (_factory, id, application) {
                assert.strictEqual(_factory, factory);
                assert.equal(id, 'factory1');
                done();
            });
            application.use('factory1', factory);
        });
    });

    describe('Fossil.Application provides a PubSub', function (done) {
        it('should be possible to communicate using events', function() {
            this.timeout(10);
            var application = new Application();
            application.on('foo', done);
            application.trigger('foo');
        });

        it('should accept events definition in the prototype', function(done) {
            this.timeout(10);
            var Application1 = Application.extend({
                events: {
                    'bar': 'foo'
                },
                foo: function () {
                    done();
                }
            });

            var application = new Application1();
            application.trigger('bar');
        });
    });

    describe('Fossil.Application Publish Subscribe generation', function () {
        it('should be able to register listeners on application', function(done) {
            this.timeout(10);
            var application = new Application();
            var pubsub = application.createPubSub();

            pubsub.on('foo', done);
            application.trigger('foo');
        });

        it('should be able to trigger events on application', function(done) {
            this.timeout(10);
            var application = new Application();
            var pubsub = application.createPubSub();

            application.on('foo', function (a, b) {
                assert.equal(arguments.length, 2);
                assert.deepEqual(a, "a");
                assert.deepEqual(b, "b");
                done();
            });
            pubsub.trigger('foo', "a", "b");
        });

        it('should be able to unregister a listener', function() {
            var application = new Application();
            var pubsub = application.createPubSub();

            function callback() {
                throw new Error('this should have been removed');
            }

            application.on('foo', callback);
            pubsub.off('foo', callback);
            application.trigger('foo', "a", "b");
        });
    });
});
