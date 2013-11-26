/* global console */
define(['underscore', 'backbone', '../utils', '../service'], function (_, Backbone, utils, Service) {
    'use strict';

    var Routing = Service.extend({
        // prefix to apply for every URL
        prefix: '',
        // router to use
        router: null,
        // [Backbone.history.start](http://backbonejs.org/#History-start) options
        history: null,

        useDeep: true,

        initialize: function (options) {
            utils.copyOption(['router', 'prefix', 'history'], this, options);
            _.bindAll(this, 'startHistory', 'stopHistory', 'navigate', 'route');
            if (!this.router) {
                this.router = new Backbone.Router();
            }
        },

        use: function (module, parent, moduleid) {
            if (!parent) {
                this.listenTo(module, 'start:first', this.startHistory);
                this.listenTo(module, 'stop', this.stopHistory);
            }

            this.listenTo(module, 'do:route:navigate', this.navigate);
            this.listenTo(module, 'do:route:register', this.route);

            this
                .setModuleUrl(module, parent, moduleid)
                .registerModuleRoutes(module);
        },

        dispose: function (module, parent, moduleid) {
            this.unregisterModuleRoutes(module);
            module.url = null;

            this.stopListening(module, 'do:route:navigate', this.navigate);
            this.stopListening(module, 'do:route:register', this.route);

            if (!parent) {
                this.stopListening(module, 'start:first', this.startHistory);
                this.stopListening(module, 'stop', this.stopHistory);
            }
        },

        setModuleUrl: function (module, parent, moduleid) {
            var parentUrl = parent ? parent.url : this.prefix;

            // copy properties
            utils.copyOption(['urlRoot'], module, module.options);

            if (typeof module.urlRoot === "undefined" || null === module.urlRoot) {
                module.urlRoot = moduleid;
            }

            module.url = url(parentUrl, module.urlRoot);

            return this;
        },

        registerModuleRoutes: function (module) {
            var routes = module.routes;
            if (!routes) {
                return this;
            }

            _.each(routes, function (callback, path) {
                module.route(path, callback);
            });

            return this;
        },

        unregisterModuleRoutes: function (module) {
            var routes = module.routes;
            if (!routes) {
                return this;
            }

            console.error('Up to now there is no way to unregister routes');

            return this;
        },

        startHistory: function (module) {
            module.thenWith(this, function () {
                if (!Backbone.History.started) {
                    Backbone.history.start(this.history);
                }
            });

            return this;
        },

        stopHistory: function () {
            if (Backbone.History.started) {
                Backbone.history.stop();
            }

            return this;
        },

        // Navigate to a route.
        // This method is bound to module's 'do:route:navigate' event
        //
        // It mainly binds Backbone.Router `navigate` method.
        navigate: function (module, path) {
            var extra = _.rest(arguments, 2);

            path = url(module.url, path);
            this.router.navigate.apply(this.router, [path].concat(extra));

            return this;
        },

        // Register a route.
        // This method is bound to module's 'do:route:navigate' event
        //
        // It mainly binds Backbone.Router `route` method.
        route: function (module, path, name, callback) {
            var original;
            path = url(module.url, path);
            if (typeof(name) === "function" || !callback) {
                callback = name;
                name = '';
            }
            original = callback;
            callback = function fossilRouting() {
                var eventName, method;
                var args = arguments;
                if (typeof(original) === "string" && typeof(module[original]) === "function") {
                    // path is the name of a method
                    method = module[original];
                    original = method;
                } else if (typeof(original) === "string" && typeof(original) !== "function") {
                    // path is a string and no matching method
                    // let's trigger the event
                    eventName = original;
                    original = _.bind(module.trigger, module, eventName);
                }
                // start module if not already
                if (!module.run) {
                    module.start();
                }
                // Once module is started, call the route function.
                module.then(function () {
                    original.apply(module, args);
                });
            };
            this.router.route.call(this.router, path, name, callback);

            return this;
        }


    });

    function url() {
        var parts = _.toArray(arguments);
        parts = _.reduce(parts, function (accumulator, part) {
            if (part) {
                accumulator.push(cleanFragment(part, !accumulator.length));
            }

            return accumulator;
        }, []);

        return parts.join('/');
    }

    var cleanFirstReg = new RegExp('^(.*[^/]+)/*$');
    var cleanReg = new RegExp('^/*([^/]*.*[^/]+)/*$');
    function cleanFragment(fragment, first) {
        if (first) {
            return fragment.match(cleanFirstReg)[1];
        }
        return fragment.match(cleanReg)[1];
    }

    return Routing;
});
