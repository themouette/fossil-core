Fossil.Services.Routing = (function (Fossil, _, Backbone) {
    'use strict';

    var Routing = Fossil.Service.extend({
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

        registerRoutesFor: function (component, prefix) {
            var service = this;
            var routes = _.extend(
                component.routes || {},
                component.options.routes || {}
            );
            prefix = prefixPath(prefix, this.options.prefix);
            _.each(routes, function (route, path) {
                service.router.route(
                    prefixPath(path, prefix),
                    _.bind(service.routeListener, service, component, route)
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
        routeListener: function (component, route) {
            var service = this;
            var args = _.tail(_.tail(arguments));
            if (component.then) {
                component.then(function () {
                    service._callRoute(service.application, component, route, args);
                });
            } else {
                service._callRoute(service.application, component, route, args);
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
        _callRoute: function (observable, component, route, args) {
            if (_.isFunction(route)) {
                // in case of function
                route.apply(component, args);

            } else if (_.isFunction(component[route])) {
                // in case a method name is given
                component[route].apply(component, args);

            } else if (_.isString(route)) {
                // in case it's a string, use it as event name
                observable.trigger.apply(component, [route].concat(args));
            } else {
                throw new Error('Invalid route definition');
            }
        }
    });

    function prefixPath(path, prefix) {
        return [ prefix || '', path || '' ].join('');
    }

    return Routing;
})(Fossil, _, Backbone);
