define([
    'jquery', 'assert', 'underscore', 'backbone', 'sinon', 'fossil/module',
    'fossil/services/routing', 'fossil/deferred'
], function ($, assert, _, Backbone, sinon, Module, Routing, Deferred) {
    "use strict";
    var location, window;
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

    // A helper function to regenerate history before launching a test.
    //
    // Use it for every test that starts a router.
    function replaceHistory() {
        location = new Location('http://example.com');
        Backbone.history = _.extend(new Backbone.History(), {location: location});
        Backbone.history.interval = 2;
    }
    function emptyFn() {}


    suite('service/routing', function () {

        teardown(function () {
            Backbone.history.stop();
        });

        suite('options', function () {
            _.each(['router', 'prefix', 'history'], function (key) {
                suite('#'+key, function () {
                    test('should be copied', function () {
                        var options, routing;
                        options = {};
                        options[key] = 'foo';
                        routing = new Routing(options);

                        assert.equal(routing[key], 'foo');
                    });
                });
            });
        }); // end of suite options

        suite('#setModuleUrl()', function () {
            suite('without module `urlRoot`', function () {
                test('should prepend parent.url if parent is provided', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var parent = {url: 'bar'};
                    var module = {};

                    routing.setModuleUrl(module, parent);

                    assert.equal(module.url, parent.url);
                });
                test('should prepend parent.url if parent is provided and parent.url is empty', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var parent = {url: ''};
                    var module = {};

                    routing.setModuleUrl(module, parent);

                    assert.equal(module.url, parent.url);
                });
                test('should prepend prefix if no parent is provided', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var module = {};

                    routing.setModuleUrl(module);

                    assert.equal(module.url, routing.prefix);
                });
            });
            suite('with module `urlRoot`', function () {
                test('should prepend parent.url if parent is provided', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var parent = {url: 'bar'};
                    var module = {urlRoot: 'baz'};

                    routing.setModuleUrl(module, parent);

                    assert.equal(module.url, [parent.url, module.urlRoot].join('/'));
                });
                test('should prepend parent.url if parent is provided and parent.url is empty', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var parent = {url: ''};
                    var module = {urlRoot: 'baz'};

                    routing.setModuleUrl(module, parent);

                    assert.equal(module.url, module.urlRoot);
                });
                test('should prepend prefix if no parent is provided', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var module = {urlRoot: 'baz'};

                    routing.setModuleUrl(module);

                    assert.equal(module.url, [routing.prefix, module.urlRoot].join('/'));
                });
            });

            suite('leading slashes', function () {
                test('in prefix', function () {
                    var routing = new Routing({prefix: '/foo'});
                    var module = {urlRoot: 'baz'};

                    routing.setModuleUrl(module);

                    assert.equal(module.url, '/foo/baz');
                });
                test('in parent', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var parent = {url: '/bar'};
                    var module = {urlRoot: 'baz'};

                    routing.setModuleUrl(module, parent);

                    assert.equal(module.url, '/bar/baz');
                });
            });
            suite('trailing slashes', function () {
                test('in prefix', function () {
                    var routing = new Routing({prefix: 'foo/'});
                    var module = {urlRoot: 'baz'};

                    routing.setModuleUrl(module);

                    assert.equal(module.url, 'foo/baz');
                });
                test('in parent', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var parent = {url: 'bar/'};
                    var module = {urlRoot: 'baz'};

                    routing.setModuleUrl(module, parent);

                    assert.equal(module.url, 'bar/baz');
                });
                test('in urlRoot', function () {
                    var routing = new Routing({prefix: 'foo'});
                    var parent = {url: 'bar'};
                    var module = {urlRoot: 'baz/'};

                    routing.setModuleUrl(module, parent);

                    assert.equal(module.url, 'bar/baz');
                });
            });
        }); // end of suite #setModuleUrl()

        suite('Module', function () {
            suite('actions', function () {
                var module, routing, router, spy;
                setup(function () {
                    router = new Backbone.Router();
                    spy = sinon.spy();
                    module = new Module();
                    routing = new Routing({
                        router: router
                    });

                    module.use('routing', routing);
                });
                test('#navigate()', function () {
                    var options = {trigger: true, replace: true};

                    // spy on router navigate method
                    router.navigate = spy;

                    module.navigate('foo', options);

                    assert.ok(spy.calledOnce);
                    assert.ok(spy.calledWith('foo', options));
                });
                test('#route()', function () {

                    // spy on router route method
                    router.route = spy;

                    module.route('foo', 'bar', emptyFn);

                    assert.ok(spy.calledOnce);
                    assert.ok(spy.calledWith('foo', 'bar'/* callback is wrapped */));
                    assert.ok(!spy.calledWith('foo', 'bar', emptyFn));
                });
            }); // end of suite actions

            suite("options", function () {
                suite("#urlRoot", function () {
                    test('should be copied', function () {
                        var module = new Module({urlRoot: 'foo'});
                        module.use('routing', new Routing());

                        assert.equal(module.urlRoot, 'foo');
                    });
                });
                suite("#routes", function () {
                    var module, routing, router, spy, TestModule;
                    setup(function () {
                        replaceHistory();
                        spy = sinon.spy();
                        // creates a stub module binding
                        TestModule = Module.extend({});
                        router = new Backbone.Router();
                        routing = new Routing({
                            router: router
                        });

                        Backbone.history.start();
                    });
                    teardown(function () {
                        Backbone.history.stop();
                    });
                    test('should accept functions', function () {
                        TestModule.prototype.routes = {
                            'foo': spy
                        };
                        module = new TestModule();
                        module.use('routing', routing);

                        router.navigate('foo', {trigger: true, replace: true});

                        assert.ok(spy.calledOnce);
                    });
                    test('should accept method name', function () {
                        TestModule.prototype.routes = {
                            'foo': 'bar'
                        };
                        module = new TestModule();
                        // this is possible as callbacks are
                        // lazy bounded
                        module.bar = spy;
                        module.use('routing', routing);

                        router.navigate('foo', {trigger: true, replace: true});

                        assert.ok(spy.calledOnce);
                    });
                    test('should accept event name', function () {
                        TestModule.prototype.routes = {
                            'foo': 'bar'
                        };
                        module = new TestModule();
                        module.on('bar', spy);
                        module.use('routing', routing);

                        router.navigate('foo', {trigger: true, replace: true});

                        assert.ok(spy.calledOnce);
                    });
                }); //end of suite route
            }); //end of suite options

            suite('starting', function () {
                var module, routing, router, spy, TestModule;
                setup(function () {
                    replaceHistory();
                    spy = sinon.spy();
                    router = new Backbone.Router();
                    routing = new Routing({
                        router: router
                    });
                    module = new Module();
                    module.use('routing', routing);
                });
                teardown(function () {
                    Backbone.history.stop();
                });
                test('module should start history', function () {
                    Backbone.history.start = spy;
                    module.start();
                    assert.ok(spy.calledOnce);
                });
                test('module should be achieved by route', function () {
                    Backbone.history.start();
                    module.start = spy;
                    module.route('foo', emptyFn);
                    router.navigate('foo', {trigger: true, replace: true});
                    assert.ok(spy.calledOnce);
                });
            });
        }); // end of suite Module

        suite('Navigation', function () {
            var spy, module, child, routing;
            setup(function () {
                replaceHistory();
                spy = sinon.spy();
                module = new Module({urlRoot: 'bar'});
                child = new Module({urlRoot: 'baz'});
                routing = new Routing({
                    prefix: 'foo'
                });

                module
                    .use('routing', routing)
                    .connect('child', child);

                child.route('', spy);
                child.route('go', spy);

                module.start();
            });
            teardown(function () {
                Backbone.history.stop();
            });

            suite('should forward url parameters', function () {
                test('to event', function () {

                    child.route('a/:param', 'do:navigate:to');
                    child.on('do:navigate:to', spy);
                    child.navigate('a/123', {trigger: true, replace: true});

                    assert.ok(spy.calledOnce, 'calls url');
                    assert.ok(spy.calledWith('123'), 'parameters are forwarded');
                });

                test('to function', function () {

                    child.route('a/:param', spy);
                    child.navigate('a/123', {trigger: true, replace: true});

                    assert.ok(spy.calledOnce, 'calls url');
                    assert.ok(spy.calledWith('123'), 'parameters are forwarded');
                });

                test('to method by name', function () {

                    child.route('a/:param', 'bar');
                    child.bar = spy;
                    child.navigate('a/123', {trigger: true, replace: true});

                    assert.ok(spy.calledOnce, 'calls url');
                    assert.ok(spy.calledWith('123'), 'parameters are forwarded');
                });
            });

            test('can be triggerd by module', function () {
                child.navigate('', {trigger: true, replace: true});

                assert.ok(spy.calledOnce);
            });
            test('should use fragment (module)', function () {
                child.navigate('go', {trigger: true});

                assert.ok(spy.calledOnce);
            });

            test('can be triggerd by parent', function () {
                module.navigate('baz', {trigger: true, replace: true});

                assert.ok(spy.calledOnce);
            });
            test('should use fragment (parent)', function () {
                module.navigate('baz/go', {trigger: true, replace: true});

                assert.ok(spy.calledOnce);
            });

            test('can be triggerd by router', function () {
                routing.router.navigate('foo/bar/baz', {trigger: true, replace: true});

                assert.ok(spy.calledOnce);
            });
            test('should use fragment (router)', function () {
                routing.router.navigate('foo/bar/baz/go', {trigger: true});

                assert.ok(spy.calledOnce);
            });
        }); // end of suite Module

        suite('navigate to module', function () {

            suite('simple usage', function () {
                var module, routing, spy, routespy;
                setup(function () {
                    spy = sinon.spy();
                    routespy = sinon.spy();
                    routing = new Routing();
                    var MyModule = Module.extend({
                        routes: {
                            '': routespy
                        }
                    });
                    module = new MyModule();

                    module
                        .use('routing', routing)
                        .on('start:first', spy)
                        .start();
                });
                teardown(function () {
                    Backbone.history.stop();
                });
                test('should call start once', function () {
                    routing.router.navigate('', {trigger: true});
                    assert.ok(routespy.called, 'route called');
                    assert.ok(routespy.calledOnce, 'route only once');
                    assert.ok(spy.called, 'start has been called');
                    assert.ok(spy.calledOnce, 'only once');
                });
            });

            suite('should start', function () {
                var modulespy, childspy, module, child, routing, routespy;
                setup(function () {
                    replaceHistory();
                    modulespy = sinon.spy();
                    childspy = sinon.spy();
                    routespy = sinon.spy();

                    module = new Module({urlRoot: 'bar'});
                    child = new Module({urlRoot: 'baz'});
                    routing = new Routing({
                        prefix: 'foo'
                    });


                    child.on('start:first', childspy);

                    module
                        .use('routing', routing)
                        .on('start:first', modulespy)
                        .connect('child', child)
                        ;

                    module.route('', routespy);
                    child.route('', routespy);

                    module.start();
                });
                teardown(function () {
                    Backbone.history.stop();
                });

                test('main module only once', function () {
                    routing.router.navigate('foo/bar', {trigger: true});

                    assert.ok(routespy.calledOnce, 'route was called');

                    assert.ok(modulespy.called, 'module has been started');
                    assert.ok(modulespy.calledOnce, 'module has been started once');

                    assert.ok(!childspy.called, 'child has not been started');
                    assert.ok(!childspy.calledOnce, 'child has not been started once');
                });

                test('child module', function () {
                    routing.router.navigate('foo/bar/baz', {trigger: true});

                    assert.ok(routespy.calledOnce, 'route was called');

                    assert.ok(modulespy.called, 'module has been started');
                    assert.ok(modulespy.calledOnce, 'module has been started once');

                    assert.ok(childspy.called, 'child has been started');
                    assert.ok(childspy.calledOnce, 'child has been started once');
                });

                test('child module only once', function () {
                    child.start();
                    routing.router.navigate('foo/bar/baz', {trigger: true});

                    assert.ok(routespy.calledOnce, 'route was called');

                    assert.ok(modulespy.called, 'module has been started');
                    assert.ok(modulespy.calledOnce, 'module has been started once');

                    assert.ok(childspy.called, 'child has been started');
                    assert.ok(childspy.calledOnce, 'child has been started once');
                });
            });
        }); // end of suite Navigation

        suite('moduleid', function () {
            setup(function () {
                replaceHistory();
            });
            teardown(function () {
                Backbone.history.stop();
            });
            test('should be used as urlRoot if null', function () {
                assertUseChildidBeforeServiceConnected(null);
                Backbone.history.stop();
                replaceHistory();
                assertUseChildidAfterServiceConnected(null);
            });
            test('should be used as urlRoot if undefined', function () {
                assertUseChildidBeforeServiceConnected();
                Backbone.history.stop();
                replaceHistory();
                assertUseChildidAfterServiceConnected();
            });
            test('should not be used as urlRoot if empty', function () {
                assertDoNotUseChildidBeforeServiceConnected('');
                Backbone.history.stop();
                replaceHistory();
                assertDoNotUseChildidAfterServiceConnected('');
            });
            test('should not be used as urlRoot if already provided', function () {
                assertDoNotUseChildidBeforeServiceConnected('baz');
                Backbone.history.stop();
                replaceHistory();
                assertDoNotUseChildidAfterServiceConnected('baz');
            });

            function assertUseChildidBeforeServiceConnected(urlRoot) {
                var routespy = sinon.spy();

                var module = new Module({urlRoot: 'bar'});
                var Child = Module.extend({
                    routes: {
                        '': routespy
                    }
                });
                var child = new Child({
                    urlRoot: urlRoot
                });
                var routing = new Routing({
                    prefix: 'foo'
                });


                module
                    .connect('child', child)
                    .use('routing', routing)
                    .start();

                routing.router.navigate('foo/bar/child', {trigger: true});

                assert.ok(routespy.called, 'route should be called');
                assert.ok(routespy.calledOnce, 'once');
            }
            function assertDoNotUseChildidBeforeServiceConnected(urlRoot) {
                var routespy = sinon.spy();

                var module = new Module({urlRoot: 'bar'});
                var Child = Module.extend({
                    routes: {
                        '': routespy
                    }
                });
                var child = new Child({
                    urlRoot: urlRoot
                });
                var routing = new Routing({
                    prefix: 'foo'
                });


                module
                    .connect('child', child)
                    .use('routing', routing)
                    .start();

                routing.router.navigate('foo/bar/child', {trigger: true});

                assert.notOk(routespy.called, 'route should not be called');
            }
            function assertUseChildidAfterServiceConnected(urlRoot) {
                var routespy = sinon.spy();

                var module = new Module({urlRoot: 'bar'});
                var Child = Module.extend({
                    routes: {
                        '': routespy
                    }
                });
                var child = new Child({
                    urlRoot: urlRoot
                });
                var routing = new Routing({
                    prefix: 'foo'
                });


                module
                    .use('routing', routing)
                    .connect('child', child)
                    .start();

                routing.router.navigate('foo/bar/child', {trigger: true});

                assert.ok(routespy.called, 'route should be called');
                assert.ok(routespy.calledOnce, 'once');
            }
            function assertDoNotUseChildidAfterServiceConnected(urlRoot) {
                var routespy = sinon.spy();

                var module = new Module({urlRoot: 'bar'});
                var Child = Module.extend({
                    routes: {
                        '': routespy
                    }
                });
                var child = new Child({
                    urlRoot: urlRoot
                });
                var routing = new Routing({
                    prefix: 'foo'
                });


                module
                    .use('routing', routing)
                    .connect('child', child)
                    .start();

                routing.router.navigate('foo/bar/child', {trigger: true});

                assert.notOk(routespy.called, 'route should not be called');
            }
        });


    }); //end of suite service/routing

});
