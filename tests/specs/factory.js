define([
    "chai",
    "sinon",
    "underscore",
    "fossil/factory",
    "fossil/application",
    "fossil/module"
], function (chai, sinon, _, Factory, Application, Module) {

    var assert = chai.assert;

    describe('Fossil.Factory can manage options', function () {
        it('accepts default options', function() {
            var Factory1 = Factory.extend({
                options: {foo: 'bar'}
            });
            var factory = new Factory1();
            assert.deepEqual(factory.options, {foo: "bar"});
        });

        it('accepts an object as options', function() {
            var Factory1 = Factory.extend({
                options: {}
            });
            var factory = new Factory1({foo: 'bar'});
            assert.deepEqual(factory.options, {foo: "bar"});
        });

        it('overrides default options with given options', function() {
            var Factory1 = Factory.extend({
                options: {
                    foo: 'bar',
                    bar: 1
                }
            });
            var factory = new Factory1({
                foo: 'baz',
                baz: 2
            });
            assert.deepEqual(factory.options, {
                bar: 1,
                foo: "baz",
                baz: 2
            });
        });
    });

    describe('Fossil.Factory applies on application', function () {
        it('provides a way to communicate with application via PubSub', function(done) {
            this.timeout(10);
            var application = new Application();
            var factory = new Factory();
            factory.activateApplication(application);

            factory.application.on('foo', done);
            factory.application.trigger('foo');
        });

        it('activates application on instanciation', function(done) {
            this.timeout(10);
            var application = new Application();
            var Factory1 = Factory.extend({
                _doActivateApplication: function (_application) {
                    assert.strictEqual(application, _application);
                    done();
                }
            });
            var factory = new Factory1();
            factory.activateApplication(application);
        });

        it('can be suspended', function(done) {
            this.timeout(10);
            done = _.after(2, done);

            var application = new Application();
            var Factory1 = Factory.extend({
                _doSuspendApplication: function (_application) {
                    assert.strictEqual(application, _application);
                    done();
                }
            });
            var factory = new Factory1();
            factory.activateApplication(application);
            factory.suspendApplication(application);

            assert.isNull(factory.application, 'pubsub is removed');
            done();
        });
    });

    describe('Fossil.Factory applies on module', function () {
        it('activate any module registered later', function(done) {
            this.timeout(10);
            var module, factory, application;

            application = new Application();
            module = new Module(application);

            // create a stub factory to monitor module activation
            var Factory1 = Factory.extend({
                _doActivateModule: function (_module, _application) {
                    assert.strictEqual(module, _module);
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            factory = new Factory1();
            factory.activateApplication(application);
            application.connect('', module);
        });

        it('activate any module registered before', function(done) {
            this.timeout(10);
            var module, factory, application;

            application = new Application();
            module = new Module(application);

            // create a stub factory to monitor module activation
            var Factory1 = Factory.extend({
                _doActivateModule: function (_module, _application) {
                    assert.strictEqual(module, _module);
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            application.connect('', module);
            factory = new Factory1();
            factory.activateApplication(application);
        });

        it('does not affect module when suspended', function() {

            var application = new Application();
            var module = new Module(application);
            var Factory1 = Factory.extend({
                _doActivateModule: function (_module, _application) {
                    assert.fail('It should be desactivated');
                }
            });
            var factory = new Factory1();
            factory.activateApplication(application);
            factory.suspendApplication(application);

            application.connect('', module);
        });

        it('suspend any module registered before', function(done) {
            this.timeout(10);
            var module, factory, application;

            application = new Application();
            module = new Module(application);

            // create a stub factory to monitor module activation
            var Factory1 = Factory.extend({
                _doSuspendModule: function (_module, _application) {
                    assert.strictEqual(module, _module);
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            application.connect('', module);
            factory = new Factory1();
            factory.activateApplication(application);
            factory.suspendApplication(application);
        });
    });

    describe('Fossil.Factory exposition to module', function () {
        it('should not be exposed as default', function() {
            var factory, application;

            factory = new Factory();
            application = new Application({
                factories: {
                    'foo': factory
                },
                modules: {
                    '': Module
                }
            });

            assert.isUndefined(application.getModule('').factories.foo);
        });

        it('should be exposed', function () {
            var factory, application;

            // create a stub factory to monitor module activation
            var Factory1 = Factory.extend({
                options: {
                    exposeToModule: true
                }
            });

            application = new Application();
            factory = new Factory1();

            application.connect('', Module);
            application.use('foo', factory);
            application.connect('bar', Module);

            assert.strictEqual(application.getModule('').factories.foo, factory);
            assert.strictEqual(application.getModule('bar').factories.foo, factory);
        });

        it('should be possible to define factories and modules in options', function (done) {
            this.timeout(10);
            var times = 0;
            done = _.after(3, done);
            var Application1 = Application.extend({
                factories: {
                    'factory1': new (Factory.extend({
                        options: {exposeToModule: true},
                        // this should be called only once
                        _doActivateModule: function (app) {
                            ++times;
                            if (times > 2) {
                                assert.ok(false, 'Module should be activated only once per module.');
                            }
                            done();
                        }
                    }))()
                },
                modules: {
                    '': Module.extend({}),
                    'app2': Module.extend({})
                }
            });

            new Application1();
            setTimeout(done, 5);
        });
    });

    describe('Fossil.Factory events', function () {

        it('should trigger a factory:%id%:ready on module when module is activated', function (done) {
            this.timeout(10);
            done = _.after(2, done);
            function eventTriggered() {
                done();
            }
            var application = new Application({
                factories: {
                    my_factory: Factory
                },
                modules: {
                    '': Module.extend({
                        events: {
                            'factory:my_factory:ready': eventTriggered
                        }
                    })
                }
            });

            application.connect('app/', Module.extend({
                events: {
                    'factory:my_factory:ready': eventTriggered
                }
            }));
        });

        it('should trigger a factory:%id%:ready on application when application is activated', function(done) {
            this.timeout(10);
            var application = new Application({
                factories: {
                    my_factory: Factory
                },
                events: {
                    'factory:my_factory:ready': function (factory) {
                        assert.instanceOf(factory, Factory);
                        done();
                    }
                }
            });
        });
    });
});
