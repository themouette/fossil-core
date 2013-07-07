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
            var module = new Module(application);
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
            module = new Module(application);

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

    describe('Fossil.Service exposition to module', function () {
        it('should not be exposed as default', function() {
            var service, application;

            service = new Service();
            application = new Application({
                services: {
                    'foo': service
                },
                modules: {
                    '': Module
                }
            });

            assert.isUndefined(application.getModule('').services.foo);
        });

        it('should be exposed', function () {
            var service, application;

            // create a stub service to monitor module activation
            var Service1 = Service.extend({
                options: {
                    exposeToModule: true
                }
            });

            application = new Application();
            service = new Service1();

            application.connect('', Module);
            application.use('foo', service);
            application.connect('bar', Module);

            assert.strictEqual(application.getModule('').services.foo, service);
            assert.strictEqual(application.getModule('bar').services.foo, service);
        });

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
})(chai.assert, sinon, _, Fossil.Service, Fossil.Application, Fossil.Module);
