define([
    "chai",
    "fossil/project",
    "fossil/application",
    "fossil/factories/routing"
], function (chai, Project, Application, RoutingFactory) {

    describe('Fossil.Factory.Routing', function () {
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

        // as routing cannot be unregistered in backbone, this factory cannot be
        // unregistered. Tests are all made on the same instance, that makes it
        // very fragile.

        describe('Fossil.Factory.Routing register routes ', function () {

            it('should register application routes defined via extension', function(done) {
                this.timeout(10);
                done = _.after(4, done);
                function onAppBar(id) {
                    assert.equal(id, 2);
                    done();
                }

                // initialize project
                var project = new Project();
                var routing = new RoutingFactory(routingOptions);
                project.connect('app1/', Application.extend({
                    routes: {
                        'foo': 'app:foo',
                        'foo/bar': 'app:foo:bar'
                    }
                }));
                project.use('router', routing);
                project.connect('app2/', Application.extend({
                    routes: {
                        'bar/:id': 'app:bar'
                    }
                }));
                project.start();

                project.on('app:foo', done);
                project.on('app:foo:bar', done);
                project.on('app:bar', onAppBar);

                routing.navigate('app1/foo');
                routing.navigate('app1/foo/bar');
                routing.navigate('app2/bar/2');

                // all those should not be triggered
                routing.navigate('foo');

                project.off('app:foo', done);
                project.off('app:foo:bar', done);
                project.off('app:bar', onAppBar);
                done();
            });

            it('should register project routes defined via prototype', function(done) {
                this.timeout(10);
                done = _.after(2, done);
                // initialize project
                var Project1 = Project.extend({
                    routes: {
                        'project/prototype': 'project:prototype'
                    }
                });
                var project = new Project1({
                    routes: {
                        'project/options': 'project:options'
                    }
                });
                var routing = new RoutingFactory(routingOptions);
                project.use('router', routing);
                project.start();

                project.on('project:prototype', done);
                routing.navigate('project/prototype');
                project.off('project:prototype', done);
                done();
            });

            it('should register project routes defined via options', function(done) {
                this.timeout(10);
                done = _.after(2, done);
                // initialize project
                var Project1 = Project.extend({
                    routes: {
                        'project/prototype': 'project:prototype'
                    }
                });
                var project = new Project1({
                    routes: {
                        'project/options': 'project:options'
                    }
                });
                var routing = new RoutingFactory(routingOptions);
                project.use('router', routing);
                project.start();

                project.on('project:options', done);
                routing.navigate('project/options');
                project.off('project:options', done);
                done();
            });

            it('should register router routes defined via options', function(done) {
                this.timeout(10);
                done = _.after(2, done);
                var project = new Project();
                var routing = new RoutingFactory(_.extend(
                    routingOptions,
                    {
                        routes: {
                            'router/options': 'router:options'
                        }
                    }));
                project.use('router', routing);
                project.start();

                project.on('router:options', done);
                routing.navigate('router/options');
                project.off('router:options', done);
                done();
            });

        });

        describe('Fossil.Factories.Routing triggers application workflow', function () {

            it('should trigger project events application:{teardown,change,setup} when app is changed', function (done) {
                this.timeout(50);
                done = _.after(9, done);
                // initialize project
                var project = new Project();
                var routing = new RoutingFactory(routingOptions);
                project.connect('app1/', Application.extend({
                    routes: {
                        'foo': 'app:foo',
                        'foo/bar': 'app:foo:bar'
                    }
                }));
                project.use('router', routing);
                project.connect('app2/', Application.extend({
                    routes: {
                        'bar/:id': 'app:bar'
                    }
                }));
                project.start();

                // it will migrate to app1
                project.once('application:change', function (prev, next) {
                    assert.equal(next.path, 'app1/', 'app1/foo: change to app1');
                    assert.isNull(prev, 'no previous app');
                    done();
                });
                project.once('application:setup', function (application) {
                    assert.equal(application.path, 'app1/', 'app1/foo: setup app1');
                    done();
                });
                routing.navigate('app1/foo');

                // it will migrate to app2
                project.once('application:teardown', function (application) {
                    assert.equal(application.path, 'app1/', 'app2/bar/2: teardown app1');
                    done();
                });
                project.once('application:change', function (prev, next) {
                    assert.equal(prev.path, 'app1/', 'app2/bar/2: change from app1');
                    assert.equal(next.path, 'app2/', 'app2/bar/2: change to app2');
                    done();
                });
                project.once('application:setup', function (application) {
                    assert.equal(application.path, 'app2/', 'app2/bar/2: setup app2');
                    done();
                });
                routing.navigate('app2/bar/2');

                // it will migrate to app1
                project.once('application:teardown', function (application) {
                    assert.equal(application.path, 'app2/', 'app1/foo/bar: teardown app2');
                    done();
                });
                project.once('application:change', function (prev, next) {
                    assert.equal(prev.path, 'app2/', 'app1/foo/bar: change from app2');
                    assert.equal(next.path, 'app1/', 'app1/foo/bar: change to app1');
                    done();
                });
                project.once('application:setup', function (application) {
                    assert.equal(application.path, 'app1/', 'app1/foo/bar: setup app1');
                    done();
                });

                routing.navigate('app1/foo/bar');

                done();
            });

            it('should trigger project events application:{teardown,change,setup} when app is not changed', function () {
                function failure() {
                    assert(false, 'application did not change.');
                }
                // initialize project
                var project = new Project();
                var routing = new RoutingFactory(routingOptions);
                project.connect('app1/', Application.extend({
                    routes: {
                        'foo': 'app:foo',
                        'foo/bar': 'app:foo:bar'
                    }
                }));
                project.use('router', routing);
                project.connect('app2/', Application.extend({
                    routes: {
                        'bar/:id': 'app:bar'
                    }
                }));
                project.start();

                routing.navigate('app1/foo');

                project.on('application:teardown', failure);
                project.on('application:change', failure);
                project.on('application:setup', failure);

                routing.navigate('app1/foo/bar');
            });
        });
    });
});
