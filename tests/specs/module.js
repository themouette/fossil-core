(function (chai, Module, Application) {

    var assert = chai.assert;

    describe('Fossil.Module', function () {
        describe('Fossil.Module constructor prototype', function () {

            it('accepts `path` as second argument', function() {
                var application = new Application();
                var app = new Module(application, 'path');

                assert.equal(app.path, 'path');
                assert.isObject(app.options);
            });

            it('accepts `path` as an option', function() {
                var application = new Application();
                var app = new Module(application, {path: 'path'});

                assert.equal(app.path, 'path');
                assert.isObject(app.options);
            });

            it('sould be possible to give no path nor options', function() {
                var application = new Application();
                var app = new Module(application);

                assert.equal(app.path, '');
                assert.isObject(app.options);
            });
        });

        describe('Fossil.Module can communicate with application via pubsub', function () {
            it('proveds access to application pubsub', function(done) {
                var application = new Application();
                var app = new Module(application);

                app.application.on('foo', done);
                app.application.trigger('foo');
            });
        });

        describe('Fossil.Module events registration', function () {

            it('should regiter events on module pub sub', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var application = new Application({
                    modules: {
                        app1: Module.extend({
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

                application.getModule('app1').trigger('foo');
                application.getModule('app1').trigger('bar');
            });

            it('should regiter applicationEvents on module pub sub', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var application = new Application({
                    modules: {
                        app1: Module.extend({
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

