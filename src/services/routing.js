//
//
//
define([
    "fossil/core",
    "underscore",
    "backbone",
    "fossil/service"
], function (Fossil, _, Backbone, Service) {

    var Routing = Fossil.Services.Routing = Service.extend({
        options: {
            // prefix to use for every route
            prefix: '',
            // default options for navigate method
            navigate: {
                trigger: true
            }
        },
        initialize: function () {
            // create router
            this.router = new Backbone.Router();
            this.registerRoutesFor(this);
        },

        registerRoutesFor: function (element, prefix) {
            var service = this;
            var routes = _.extend(
                element.routes || {},
                element.options.routes || {}
            );
            prefix = prefixPath(prefix, this.options.prefix);
            _.each(routes, function (eventname, path) {
                service.router.route(
                    prefixPath(path, prefix),
                    eventname,
                    _.bind(service.routeListener, service, eventname)
                );
            });
        },
        _doActivateApplication: function (application) {
            // add all application routes
            this.registerRoutesFor(application);

            // add event handler on router:navigate
            // to trigger navigation
            this.listenTo(application, 'router:navigate', _.bind(this.navigate, this));
            this.listenTo(application, 'start', _.bind(this.startListener, this));
        },
        _doActivateModule: function (module, application) {
            // add all module routes
            var service = this;
            var prefix = prefixPath(module.path, this.options.prefix);
            _.each(module.routes || {}, function (eventname, path) {
                service.router.route(
                    prefixPath(path, prefix),
                    eventname,
                    _.bind(service.moduleRouteListener, service, application, module, eventname)
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
        moduleRouteListener: function (application, module, eventname) {
            application.switchModule(module);
            // remove both application and module
            var args = _.tail(_.tail(arguments));
            module.then(function moduleReady() {
                module.trigger.apply(module, args);
            });
        },
        routeListener: function (eventname) {
            this.application.trigger.apply(this.application, arguments);
        },

        navigate: function (fragment, options) {
            var o = _.extend(
                {},
                this.options.navigate || {},
                options || {}
            );
            this.router.navigate.call(this.router, fragment, o);
        }
    });

    function prefixPath(path, prefix) {
        return [ prefix || '', path || '' ].join('');
    }

    return Routing;
});
