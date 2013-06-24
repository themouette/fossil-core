//
//
//
define([
    "fossil/core",
    "underscore",
    "backbone",
    "fossil/factory"
], function (Fossil, _, Backbone, Factory) {

    var Routing = Fossil.Factories.Routing = Factory.extend({
        options: {
            // prefix to use for every route
            prefix: '',
            // default options for navigate method
            navigate: {
                trigger: true
            }
        },
        currentModule: null,
        initialize: function () {
            // create router
            this.router = new Backbone.Router();
            this.registerRoutesFor(this);
        },

        registerRoutesFor: function (element, prefix) {
            var factory = this;
            var routes = _.extend(
                element.routes || {},
                element.options.routes || {}
            );
            prefix = prefixPath(prefix, this.options.prefix);
            _.each(routes, function (eventname, path) {
                factory.router.route(
                    prefixPath(path, prefix),
                    eventname,
                    _.bind(factory.routeListener, factory, eventname)
                );
            });
        },
        _doActivateApplication: function (application) {
            // add all application routes
            this.registerRoutesFor(application);

            // add event handler on router:navigate
            // to trigger navigation
            this.listenTo(application, 'router:navigate', this.navigate, this);
            this.listenTo(application, 'start', this.startListener, this);
        },
        _doActivateModule: function (module, application) {
            // add all module routes
            var factory = this;
            var prefix = prefixPath(module.path, this.options.prefix);
            _.each(module.routes || {}, function (eventname, path) {
                factory.router.route(
                    prefixPath(path, prefix),
                    eventname,
                    _.bind(factory.moduleRouteListener, factory, module, eventname)
                );
            });
        },
        _doSuspendApplication: function (application) {
            // remove all application routes
            Backbone.history.stop();
            // remove event handler for navigation
            this.stopListening();
        },
        _doSuspendModule: function (module, application) {
            // remove all module routes
        },

        startListener: function () {
            Backbone.history.start(this.options.history);
        },
        moduleRouteListener: function (module, eventname) {
            var moduleChange = (this.currentModule !== module);
            if (moduleChange && this.currentModule) {
                this.application.trigger('module:teardown', this.currentModule);
                this.currentModule.teardown();
            }
            if (moduleChange) {
                this.application.trigger('module:change', this.currentModule, module);
                module.setup();
                this.application.trigger('module:setup', module);
            }
            this.currentModule = module;
            var args = _.tail(arguments);
            module.trigger.apply(module, args);
        },
        routeListener: function (eventname) {
            this.application.trigger.apply(this.application, arguments);
        },

        navigate: function (fragment, options) {
            var o = _.extend(
                {},
                this.options.navigate || {},
                options || {}
            );
            this.router.navigate.call(this.router, fragment, o);
        }
    });

    function prefixPath(path, prefix) {
        return [ prefix || '', path || '' ].join('');
    }

    return Routing;
});
