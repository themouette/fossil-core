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
        currentApplication: null,
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
        _doActivateProject: function (project) {
            // add all project routes
            this.registerRoutesFor(project);

            // add event handler on router:navigate
            // to trigger navigation
            this.listenTo(project, 'router:navigate', this.navigate, this);
            this.listenTo(project, 'start', this.startListener, this);
        },
        _doActivateApplication: function (application, project) {
            // add all application routes
            var factory = this;
            var prefix = prefixPath(application.path, this.options.prefix);
            _.each(application.routes || {}, function (eventname, path) {
                factory.router.route(
                    prefixPath(path, prefix),
                    eventname,
                    _.bind(factory.applicationRouteListener, factory, application, eventname)
                );
            });
        },
        _doSuspendProject: function (project) {
            // remove all project routes
            Backbone.history.stop();
            // remove event handler for navigation
            this.stopListening();
        },
        _doSuspendApplication: function (application, project) {
            // remove all application routes
        },

        startListener: function () {
            Backbone.history.start(this.options.history);
        },
        applicationRouteListener: function (application, eventname) {
            var appChange = (this.currentApplication !== application);
            if (appChange && this.currentApplication) {
                this.project.trigger('application:teardown', this.currentApplication);
                application.teardown();
            }
            if (appChange) {
                this.project.trigger('application:change', this.currentApplication, application);
                application.setup();
                this.project.trigger('application:setup', application);
            }
            this.currentApplication = application;
            var args = _.tail(arguments);
            this.project.trigger.apply(this.project, args);
        },
        routeListener: function (eventname) {
            this.project.trigger.apply(this.project, arguments);
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
