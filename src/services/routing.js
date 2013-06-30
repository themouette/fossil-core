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
            _.each(routes, function (route, path) {
                service.router.route(
                    prefixPath(path, prefix),
                    _.bind(service.routeListener, service, element, route)
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
        moduleRouteListener: function (application, module, route) {
            var service = this;
            var args = _.tail(_.tail(_.tail(arguments)));
            application.switchModule(module);
            module.then(function () {
                service._callRoute(module, module, route, args);
            });
        },
        routeListener: function (element, route) {
            var service = this;
            var args = _.tail(_.tail(arguments));
            if (element.then) {
                element.then(function () {
                    service._callRoute(service.application, element, route, args);
                });
            } else {
                service._callRoute(service.application, element, route, args);
            }
        },

        navigate: function (fragment, options) {
            var o = _.extend(
                {},
                this.options.navigate || {},
                options || {}
            );
            this.router.navigate.call(this.router, fragment, o);
        },
        _callRoute: function (observable, element, route, args) {
            if (_.isFunction(route)) {
                // in case of function
                route.apply(element, args);

            } else if (_.isFunction(element[route])) {
                // in case a method name is given
                element[route].apply(element, args);

            } else if (_.isString(route)) {
                // in case it's a string, use it as event name
                observable.trigger.apply(element, [route].concat(args));
            } else {
                throw new Error('Invalid route definition');
            }
        }
    });

    function prefixPath(path, prefix) {
        return [ prefix || '', path || '' ].join('');
    }

    return Routing;
});
