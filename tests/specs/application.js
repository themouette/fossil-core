define([
    "chai",
    "underscore",
    "fossil/application",
    "fossil/module",
    "fossil/service",
], function (chai, _, Application, Module, Service) {

    var assert = chai.assert;

    describe('Fossil.Application', function () {
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

        describe('Fossil.Application can use Service-s', function () {
            it('should be possible to use a service and retreive it', function () {
                var application = new Application();
                application.use('foo', new Service());

                assert.instanceOf(application.services.foo, Service);
            });

            it('should be possible to use multiple services and retreive it', function () {
                var application = new Application();
                var Service1 = Service.extend({});
                var Service2 = Service.extend({});

                application.use('foo', new Service1());
                application.use('bar', new Service2());

                assert.instanceOf(application.services.foo, Service1);
                assert.instanceOf(application.services.bar, Service2);
            });

            it('should be possible to use an uninstanciated service', function () {
                var application = new Application();
                application.use('foo', Service);

                assert.instanceOf(application.services.foo, Service);
            });

            it('should be possible to define services in options', function () {
                var application = new Application({
                    services: {
                        'foo': Service
                    }
                });

                assert.instanceOf(application.services.foo, Service);
            });

            it('should activate service for application when in use', function (done) {
                this.timeout(10);
                var application = new Application();
                var Service1 = Service.extend({
                    _doActivateApplication: function (_application) {
                        assert.strictEqual(application, _application);
                        done();
                    }
                });

                application.use('service1', Service1);
            });

            it('should suspend previous service for application when in use', function (done) {
                this.timeout(10);
                done = _.after(3, done);
                var application = new Application();
                var Service1 = Service.extend({
                    _doSuspendApplication: function (_application) {
                        assert.strictEqual(application, _application);
                        done();
                    }
                });
                var Service2 = Service.extend({
                    _doActivateApplication: function (_application) {
                        assert.strictEqual(application, _application);
                        done();
                    }
                });

                application.use('service1', Service1);
                application.use('service1', Service2);
                assert.instanceOf(application.services.service1, Service2);
                done();
            });

            it('should trigger a service:use event when new service is used', function (done) {
                this.timeout(10);
                var application = new Application();
                var service = new Service();
                application.on('service:use', function (_service, id, application) {
                    assert.strictEqual(_service, service);
                    assert.equal(id, 'service1');
                    done();
                });
                application.use('service1', service);
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

        describe('Application switch', function () {

            it('keeps track of current application', function() {
                var application = new Application({
                    modules: {
                        '1': Module,
                        '2': Module
                    }
                });
                application.start();

                var module1 = application.getModule('1');
                var module2 = application.getModule('2');

                assert.ok(!application.currentModule, 'current module is falsy');
                application.switchModule(module1);
                assert.strictEqual(application.currentModule, module1);
                application.switchModule(module2);
                assert.strictEqual(application.currentModule, module2);
            });

            it('setup and teardown modules on switches', function(done) {
                this.timeout(10);
                done = _.after(3, done);
                function success () {
                    assert(true);
                    done();
                }
                function failure() {
                    assert(false);
                }

                var application = new Application({
                    modules: {
                        '1': Module,
                        '2': Module
                    }
                });
                application.start();

                var module1 = application.getModule('1');
                var module2 = application.getModule('2');

                var observable = _.clone(Backbone.Events);

                observable.listenTo(module1, 'setup', success);
                observable.listenTo(module1, 'teardown', failure);
                observable.listenTo(module2, 'setup', failure);
                observable.listenTo(module2, 'teardown', failure);
                // switch
                application.switchModule(module1);

                observable.stopListening();
                observable.listenTo(module1, 'setup', failure);
                observable.listenTo(module1, 'teardown', success);
                observable.listenTo(module2, 'setup', success);
                observable.listenTo(module2, 'teardown', failure);

                // switch again
                application.switchModule(module2);

                observable.stopListening();
                observable.listenTo(module1, 'setup', failure);
                observable.listenTo(module1, 'teardown', failure);
                observable.listenTo(module2, 'setup', failure);
                observable.listenTo(module2, 'teardown', failure);

                // no app switch implies no events
                application.switchModule(module2);
            });
        });
    });
});
