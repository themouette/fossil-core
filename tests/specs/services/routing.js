define([
    "chai",
    "fossil/application",
    "fossil/module",
    "fossil/services/routing"
], function (chai, Application, Module, RoutingService) {

    describe('Fossil.Service.Routing', function () {
        var assert = chai.assert;
        var location, window;
        var routingOptions = {
            //default navigate options.
            navigate: {
                trigger: true,
                replace: true
            },
            // options to pass to history.start
            history: { }
        };
        // Mocking location
        var Location = function(href) {
            this.replace(href);
        };

        _.extend(Location.prototype, {

            replace: function(href) {
                _.extend(this, _.pick($('<a></a>', {href: href})[0],
                    'href',
                    'hash',
                    'host',
                    'search',
                    'fragment',
                    'pathname',
                    'protocol'
                ));
                // In IE, anchor.pathname does not contain a leading slash though
                // window.location.pathname does.
                if (!/^\//.test(this.pathname)) this.pathname = '/' + this.pathname;
            },

            toString: function() {
                return this.href;
            }

        });

        beforeEach(function () {
            location = new Location('http://example.com');
            Backbone.history = _.extend(new Backbone.History(), {location: location});
            Backbone.history.interval = 2;
        });

        afterEach(function () {
            Backbone.history.stop();
        });

        // as routing cannot be unregistered in backbone, this service cannot be
        // unregistered. Tests are all made on the same instance, that makes it
        // very fragile.

        describe('Fossil.Service.Routing register routes ', function () {

            it('should register module routes defined via extension', function(done) {
                this.timeout(10);
                done = _.after(4, done);
                function onModBar(id) {
                    assert.equal(id, 2);
                    done();
                }

                // initialize application
                var application = new Application();
                var routing = new RoutingService(routingOptions);
                application.connect('mod1/', Module.extend({
                    routes: {
                        'foo': 'mod:foo',
                        'foo/bar': 'mod:foo:bar'
                    }
                }));
                application.use('router', routing);
                application.connect('mod2/', Module.extend({
                    routes: {
                        'bar/:id': 'mod:bar'
                    }
                }));
                application.start();

                var module1 = application.getModule('mod1/');
                var module2 = application.getModule('mod2/');
                module1.on('mod:foo', done);
                module1.on('mod:foo:bar', done);
                module2.on('mod:bar', onModBar);

                routing.navigate('mod1/foo');
                routing.navigate('mod1/foo/bar');
                routing.navigate('mod2/bar/2');

                // all those should not be triggered
                routing.navigate('foo');

                done();
            });

            it('should accept methods and function as route', function(done) {
                this.timeout(10);
                done = _.after(2, done);

                var Application1 = Application.extend({
                    routes: {
                        'first/:id': 'first',
                        'second/:id': function (id) {
                            assert.equal(id, 2);
                            done();
                        }

                    },
                    first: function (id) {
                        assert.equal(id, 1);
                        done();
                    }
                });
                var application = new Application1();
                var routing = new RoutingService(routingOptions);
                application.use('router', routing);
                application.start();
                routing.navigate('first/1');
                routing.navigate('second/2');
            });

            it('should register application routes defined via prototype', function(done) {
                this.timeout(10);
                done = _.after(2, done);
                // initialize application
                var Application1 = Application.extend({
                    routes: {
                        'application/prototype': 'application:prototype'
                    }
                });
                var application = new Application1({
                    routes: {
                        'application/options': 'application:options'
                    }
                });
                var routing = new RoutingService(routingOptions);
                application.use('router', routing);
                application.start();

                application.on('application:prototype', done);
                routing.navigate('application/prototype');
                done();
            });

            it('should register application routes defined via options', function(done) {
                this.timeout(10);
                done = _.after(2, done);
                // initialize application
                var Application1 = Application.extend({
                    routes: {
                        'application/prototype': 'application:prototype'
                    }
                });
                var application = new Application1({
                    routes: {
                        'application/options': 'application:options'
                    }
                });
                var routing = new RoutingService(routingOptions);
                application.use('router', routing);
                application.start();

                application.on('application:options', done);
                routing.navigate('application/options');
                application.off('application:options', done);
                done();
            });

            it('should register router routes defined via options', function(done) {
                this.timeout(10);
                done = _.after(2, done);
                var application = new Application();
                var routing = new RoutingService(_.extend(
                    routingOptions,
                    {
                        routes: {
                            'router/options': 'router:options'
                        }
                    }));
                application.use('router', routing);
                application.start();

                application.on('router:options', done);
                routing.navigate('router/options');
                application.off('router:options', done);
                done();
            });

        });

        describe('Fossil.Services.Routing triggers module workflow', function () {

            it('should trigger application events module:{standby,change,start} when app is changed', function (done) {
                this.timeout(50);
                done = _.after(9, done);
                // initialize application
                var application = new Application();
                var routing = new RoutingService(routingOptions);
                application.connect('app1/', Module.extend({
                    routes: {
                        'foo': 'app:foo',
                        'foo/bar': 'app:foo:bar'
                    }
                }));
                application.use('router', routing);
                application.connect('app2/', Module.extend({
                    routes: {
                        'bar/:id': 'app:bar'
                    }
                }));
                application.start();

                // it will migrate to app1
                application.once('module:change', function (prev, next) {
                    assert.equal(next.path, 'app1/', 'app1/foo: change to app1');
                    assert.isNull(prev, 'no previous app');
                    done();
                });
                application.once('module:start', function (module) {
                    assert.equal(module.path, 'app1/', 'app1/foo: start app1');
                    done();
                });
                routing.navigate('app1/foo');

                // it will migrate to app2
                application.once('module:standby', function (module) {
                    assert.equal(module.path, 'app1/', 'app2/bar/2: standby app1');
                    done();
                });
                application.once('module:change', function (prev, next) {
                    assert.equal(prev.path, 'app1/', 'app2/bar/2: change from app1');
                    assert.equal(next.path, 'app2/', 'app2/bar/2: change to app2');
                    done();
                });
                application.once('module:start', function (module) {
                    assert.equal(module.path, 'app2/', 'app2/bar/2: start app2');
                    done();
                });
                routing.navigate('app2/bar/2');

                // it will migrate to app1
                application.once('module:standby', function (module) {
                    assert.equal(module.path, 'app2/', 'app1/foo/bar: standby app2');
                    done();
                });
                application.once('module:change', function (prev, next) {
                    assert.equal(prev.path, 'app2/', 'app1/foo/bar: change from app2');
                    assert.equal(next.path, 'app1/', 'app1/foo/bar: change to app1');
                    done();
                });
                application.once('module:start', function (module) {
                    assert.equal(module.path, 'app1/', 'app1/foo/bar: start app1');
                    done();
                });

                routing.navigate('app1/foo/bar');

                done();
            });

            it('should trigger application events module:{standby,change,start} when app is not changed', function () {
                function failure() {
                    assert(false, 'module did not change.');
                }
                // initialize application
                var application = new Application();
                var routing = new RoutingService(routingOptions);
                application.connect('app1/', Module.extend({
                    routes: {
                        'foo': 'app:foo',
                        'foo/bar': 'app:foo:bar'
                    }
                }));
                application.use('router', routing);
                application.connect('app2/', Module.extend({
                    routes: {
                        'bar/:id': 'app:bar'
                    }
                }));
                application.start();

                routing.navigate('app1/foo');

                application.on('module:standby', failure);
                application.on('module:change', failure);
                application.on('module:start', failure);

                routing.navigate('app1/foo/bar');
            });

            it('should call Module `start` and `standby`', function(done) {
                this.timeout(10);
                done = _.after(3, done);
                function success () {
                    assert(true);
                    done();
                }
                function failure() {
                    assert(false);
                }
                var application = new Application();
                var routing = new RoutingService(routingOptions);
                application.connect('app1/', Module.extend({
                    routes: {
                        'foo': 'app:foo',
                        'foo/bar': 'app:foo:bar'
                    }
                }));
                application.use('router', routing);
                application.connect('app2/', Module.extend({
                    routes: {
                        'bar/:id': 'app:bar'
                    }
                }));
                application.start();
                var app1 = application.getModule('app1/');
                var app2 = application.getModule('app2/');

                app1.start = success;
                app1.standby = failure;
                app2.start = failure;
                app2.standby = failure;

                routing.navigate('app1/foo');

                app1.start = failure;
                app1.standby = failure;
                app2.start = failure;
                app2.standby = failure;

                routing.navigate('app1/foo/bar');

                app1.start = failure;
                app1.standby = success;
                app2.start = success;
                app2.standby = failure;

                routing.navigate('app2/bar/1');

            });
        });
    });
});
