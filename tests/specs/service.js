(function (assert, sinon, _, Service, Application, Module) {

    describe('Fossil.Service can manage options', function () {
        it('should extend parent options', function() {
            var Service1 = Service.extend({
                options: {foo: 'bar'}
            });
            var service = new Service1();
            assert.propertyVal(service.options, 'foo', "bar");
            assert.property(service.options, 'link');
        });
        it('accepts default options', function() {
            var Service1 = Service.extend({
                options: {foo: 'bar'}
            });
            var service = new Service1();
            assert.property(service.options, 'foo', "bar");
        });

        it('accepts an object as options', function() {
            var Service1 = Service.extend({
                options: {}
            });
            var service = new Service1({foo: 'bar'});
            assert.propertyVal(service.options, 'foo', "bar");
        });

        it('overrides default options with given options', function() {
            var Service1 = Service.extend({
                options: {
                    foo: 'bar',
                    bar: 1
                }
            });
            var service = new Service1({
                foo: 'baz',
                baz: 2
            });
            assert.propertyVal(service.options, 'bar', 1);
            assert.propertyVal(service.options, 'foo', "baz");
            assert.propertyVal(service.options, 'baz', 2);
        });
    });

    describe('Fossil.Service applies on application', function () {
        it('provides a way to communicate with application via PubSub', function(done) {
            this.timeout(10);
            var application = new Application();
            var service = new Service();
            service.activateApplication(application);

            service.application.on('foo', done);
            service.application.trigger('foo');
        });

        it('activates application on instanciation', function(done) {
            this.timeout(10);
            var application = new Application();
            var Service1 = Service.extend({
                _doActivateApplication: function (_application) {
                    assert.strictEqual(application, _application);
                    done();
                }
            });
            var service = new Service1();
            service.activateApplication(application);
        });

        it('can be suspended', function(done) {
            this.timeout(10);
            done = _.after(2, done);

            var application = new Application();
            var Service1 = Service.extend({
                _doSuspendApplication: function (_application) {
                    assert.strictEqual(application, _application);
                    done();
                }
            });
            var service = new Service1();
            service.activateApplication(application);
            service.suspendApplication(application);

            assert.isNull(service.application, 'pubsub is removed');
            done();
        });
    });

    describe('Fossil.Service applies on module', function () {
        it('activate any module registered later', function(done) {
            this.timeout(10);
            var module, service, application;

            application = new Application();
            module = new Module(application);

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                _doActivateModule: function (_module, _application) {
                    assert.strictEqual(module, _module);
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            service = new Service1();
            service.activateApplication(application);
            application.connect('', module);
        });

        it('activate any module registered before', function(done) {
            this.timeout(10);
            var module, service, application;

            application = new Application();
            module = new Module(application);

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                _doActivateModule: function (_module, _application) {
                    assert.strictEqual(module, _module);
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            application.connect('', module);
            service = new Service1();
            service.activateApplication(application);
        });

        it('does not affect module when suspended', function() {

            var application = new Application();
            var module = new Module();
            var Service1 = Service.extend({
                _doActivateModule: function (_module, _application) {
                    assert.fail('It should be desactivated');
                }
            });
            var service = new Service1();
            service.activateApplication(application);
            service.suspendApplication(application);

            application.connect('', module);
        });

        it('suspend any module registered before', function(done) {
            this.timeout(10);
            var module, service, application;

            application = new Application();
            module = new Module();

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                _doSuspendModule: function (_module, _application) {
                    assert.strictEqual(module, _module);
                    assert.strictEqual(application, _application);
                    done();
                }
            });

            application.connect('', module);
            service = new Service1();
            service.activateApplication(application);
            service.suspendApplication(application);
        });
    });

    describe('exposed methods', function () {
        it('are not required', function() {
            var service, application, module;

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                exposedMethods: null
            });
            service = new Service1();
            application = new Application();
            module = new Module();
            application.connect('', module);
            application.use('foo', service);
        });
        it('are not exposed to elements by default', function() {
            var service, application, module;
            var spy = sinon.spy();

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                exposedMethods: ["methodName"],
                methodName: spy
            });
            service = new Service1();
            module = new Module();
            application = new Application();
            application.connect('', module);
            application.use('foo', service);

            assert.isUndefined(application.methodName);
            assert.isUndefined(module.methodName);
        });
        it('are exposed to elements', function() {
            var service, application, module;
            var spy = sinon.spy();

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                exposedMethods: ["methodName"],
                methodName: spy,
                options: { expose: true}
            });
            service = new Service1();
            application = new Application();
            module = new Module();
            application.connect('', module);
            application.use('foo', service);

            assert.isFunction(application.methodName);
            assert.isFunction(module.methodName);

            application.methodName();
            assert.ok(spy.calledOnce);
            module.methodName();
            assert.ok(spy.calledTwice);
        });

        it('can be prevented from registration on application', function() {
            var service, application, module;

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                exposedMethods: ["methodName"],
                methodName: function () {},
                options: { expose: true, exposeToApplication: false}
            });
            service = new Service1();
            application = new Application();
            module = new Module();
            application.connect('', module);
            application.use('foo', service);

            assert.isUndefined(application.methodName);
            assert.isFunction(module.methodName);
        });

        it('can be prevented from registration on module', function() {
            var service, application, module;

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                exposedMethods: ["methodName"],
                methodName: function () {},
                options: { expose: true, exposeToModule: false}
            });
            service = new Service1();
            application = new Application();
            module = new Module();
            application.connect('', module);
            application.use('foo', service);

            assert.isFunction(application.methodName);
            assert.isUndefined(module.methodName);
        });
    });

    describe('fragments', function () {
        var Service1, application, module, spy;
        beforeEach(function() {
            spy = sinon.spy();
            Service1 = Service.extend({
                exposedMethods: ["methodName"],
                methodName: spy,
                options: {expose: true},
                _doActivateFragment: spy
            });
            application = new Application({
                fragments: {
                    'frag0': Fossil.Fragment
                }
            });
            module = new Module({
                fragments: {
                    'frag1': Fossil.Fragment
                }
            });
        });

        it('should not be processed on load', function() {
            var service = new Service1();
            application.use('foo', service);
            application.connect('', module);

            assert.equal(spy.callCount, 0);
        });
        it('should be processed on demand', function() {
            var service = new Service1();
            application.use('foo', service);
            application.connect('', module);

            application.ensureFragment('frag0');
            assert.ok(spy.calledOnce);
            module.ensureFragment('frag1');
            assert.ok(spy.calledTwice);
        });
    });

    describe('pass to application', function () {

        it('should be possible to define services and modules in options', function (done) {
            this.timeout(15);
            var times = 0;
            done = _.after(3, done);
            var Application1 = Application.extend({
                services: {
                    'service1': new (Service.extend({
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

    describe('Fossil.Service events', function () {

        it('should trigger a service:%id%:ready on module when module is activated', function (done) {
            this.timeout(10);
            done = _.after(2, done);
            function eventTriggered() {
                done();
            }
            var application = new Application({
                services: {
                    my_service: Service
                },
                modules: {
                    '': Module.extend({
                        events: {
                            'service:my_service:ready': eventTriggered
                        }
                    })
                }
            });

            application.connect('app/', Module.extend({
                events: {
                    'service:my_service:ready': eventTriggered
                }
            }));
        });

        it('should trigger a service:%id%:ready on application when application is activated', function(done) {
            this.timeout(10);
            var application = new Application({
                services: {
                    my_service: Service
                },
                events: {
                    'service:my_service:ready': function (service) {
                        assert.instanceOf(service, Service);
                        done();
                    }
                }
            });
        });

        it('should offer a prefixEvent method when application is active', function() {
            var service = new Service();
            assert.ok(!service.prefixEvent);
            var application = new Application();
            application.use('service', service);
            assert.ok(service.prefixEvent);
            assert.equal(service.prefixEvent('foo'), 'service:service:foo');
        });
    });

    describe('Services can be register during', function () {
        it('application initialization', function() {
            var Application1 = Application.extend({
                initialize: function () {
                    this.use('foo', new Service());
                }
            });

            var app = new Application1();
            assert.ok(app.services.foo);
        });
    });
})(chai.assert, sinon, _, Fossil.Service, Fossil.Application, Fossil.Module);
