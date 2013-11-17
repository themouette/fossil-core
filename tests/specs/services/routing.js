define([
    'jquery', 'assert', 'underscore', 'backbone', 'sinon', 'fossil/module', 'fossil/services/routing'
], function ($, assert, _, Backbone, sinon, Module, Routing) {
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
        }); // end of suite Navigation

    }); //end of suite service/routing

});
