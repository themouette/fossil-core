(function (chai, Module, Application) {

    var assert = chai.assert;

    describe('Fossil.Module', function () {
        describe('when connected', function () {

            it('accepts module id as `path`', function() {
                var application = new Application();
                var mod = new Module();
                application.connect('moduleid', mod);

                assert.equal(mod.path, 'moduleid');
                assert.isObject(mod.options);
            });

            it('accepts `path` as an option', function() {
                var application = new Application();
                var mod = new Module({path: 'path'});
                application.connect('moduleid', mod);

                assert.equal(mod.path, 'path');
                assert.isObject(mod.options);
            });

            it('should override with id only if needed', function() {
                var application = new Application();
                var mod = new Module({ path: 'modulepath' });
                application.connect('moduleid', mod);

                assert.equal(mod.path, 'modulepath');
                assert.isObject(mod.options);
            });

            it('should not override with id for empty path', function() {
                var application = new Application();
                var mod = new Module({ path: '' });
                application.connect('moduleid', mod);

                assert.equal(mod.path, '');
                assert.isObject(mod.options);
            });

            it('should import services', function() {
                var application = new Application();
                var mod = new Module({ path: '' });
                application.use('service1', new Fossil.Service());
                application.connect('moduleid', mod);
                application.use('service2', new Fossil.Service());

                assert.isObject(mod.services);
                assert.strictEqual(mod.services.service1, application.services.service1);
                assert.strictEqual(mod.services.service2, application.services.service2);
            });
        });

        describe('Fossil.Module can communicate with application via pubsub', function () {
            it('proveds access to application pubsub', function(done) {
                var application = new Application();
                var mod = new Module();
                application.connect('moduleid', mod);

                mod.application.on('foo', done);
                mod.application.trigger('foo');
            });
        });

        describe('Fossil.Module events registration', function () {

            it('should regiter events on module pub sub', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var application = new Application({
                    modules: {
                        mod1: Module.extend({
                            events: {
                                'foo': 'foo',
                                'bar': function () {
                                    done();
                                }
                            },
                            applicationEvents: {
                                'foo': function () {
                                    assert.ok(false, 'It should not register applicationEvents in app pubSub');
                                }
                            },
                            foo: function () {
                                done();
                            }
                        })
                    }
                });

                application.getModule('mod1').trigger('foo');
                application.getModule('mod1').trigger('bar');
            });

            it('should regiter applicationEvents on module pub sub', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var application = new Application({
                    modules: {
                        mod1: Module.extend({
                            applicationEvents: {
                                'foo': 'foo',
                                'bar': function () {
                                    done();
                                }
                            },
                            events: {
                                'foo': function () {
                                    assert.ok(false, 'It should not register events in application pubSub');
                                }
                            },
                            foo: function () {
                                done();
                            }
                        })
                    }
                });

                application.trigger('foo');
                application.trigger('bar');
            });
        });
    });
})(chai, Fossil.Module, Fossil.Application);

