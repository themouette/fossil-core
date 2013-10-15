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

        use: function (module, parent) {
            if (!parent) {
                this.listenTo(module, 'start:first', this.startHistory);
                this.listenTo(module, 'stop', this.stopHistory);
            }

            this.listenTo(module, 'do:route:navigate', this.navigate);
            this.listenTo(module, 'do:route:register', this.route);

            this
                .setModuleUrl(module, parent)
                .registerModuleRoutes(module);
        },

        dispose: function (module, parent) {
            this.unregisterModuleRoutes(module);
            module.url = null;

            this.stopListening(module, 'do:route:navigate', this.navigate);
            this.stopListening(module, 'do:route:register', this.route);

            if (!parent) {
                this.stopListening(module, 'start:first', this.startHistory);
                this.stopListening(module, 'stop', this.stopHistory);
            }
        },

        setModuleUrl: function (module, parent) {
            var parentUrl = parent ? parent.url : this.prefix;
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

        startHistory: function () {
            if (!Backbone.History.started) {
                Backbone.history.start(this.history);
            }

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
            if (typeof(name) === "function") {
                callback = name;
                name = '';
            }
            original = callback;
            callback = function fossilRouting() {
                if (typeof(path) === "string" && typeof(module[path]) === "function") {
                    // path is the name of a method
                    original = _.bind(module[path], module);
                } else if (typeof(path) === "string" && typeof(original) !== "function") {
                    // path is a string and no matching method
                    // let's trigger the event
                    original = _.bind(module.trigger, module, path);
                }
                if (!module.run) {
                    module.start();
                }
                module.then(_.bind(original, module, arguments));
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
