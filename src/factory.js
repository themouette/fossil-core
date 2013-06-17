define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {

    Fossil.Factories = {};

    var Factory = Fossil.Factory = function (options) {
        this.options = _.extend({}, this.options, options || {});
        this.initialize.apply(this, arguments);
    };

    _.extend(Factory.prototype, Backbone.Events, {
        // default options
        options: {
            // should the factory be exposed  to application context ?
            // an exposed factory will be available under application.factories
            exposeToApplication: false
        },
        // A hook to initialize factory,
        // after project and applications are initialized.
        initialize: function (options) {
        },

        // activate Factory for project
        activateProject: function (project, id) {
            var factory = this;

            // create pubSub
            this.project = project.createPubSub();
            // activate project
            this._doActivateProject(project);
            // activate all applications
            _.each(project.getApplication(), function (application) {
                factory.activateApplication.call(factory, application, project, id);
            });
            // register on new application connection
            this.listenTo(project, 'application:connect', _.bind(this.activateApplicationListener, this, id));
        },
        // unplug for project
        suspendProject: function (project, id) {
            var factory = this;
            // suspend for every project applications
            _.each(project.getApplication(), function (application) {
                factory.suspendApplication.call(factory, application, project, id);
            });
            // remove event handler
            this.stopListening();
            // remove pubsub reference
            this.project = null;
            // finally suspend for project
            this._doSuspendProject(project);
        },

        activateApplication: function (application, project, id) {
            if (this.options.exposeToApplication) {
                application.factories[id] = this;
            }
            this._doActivateApplication.apply(this, arguments);
        },
        suspendApplication: function (application, project, id) {
            if (this.options.exposeToApplication) {
                application.factories[id] = null;
            }
            this._doSuspendApplication.apply(this, arguments);
        },

        activateApplicationListener: function (id, application, path, project) {
            this.activateApplication(application, project, id);
        },

        // activate factory on project.
        // this method has to be overriden with the factory logic.
        _doActivateProject: function (project) {
        },
        // activate factory on application.
        // this method has to be overriden with the factory logic.
        _doActivateApplication: function (application, project) {
        },
        // suspend factory on project.
        // this method has to be overriden with the factory logic.
        _doSuspendProject: function (project) {
        },
        // suspend factory on application.
        // this method has to be overriden with the factory logic.
        _doSuspendApplication: function (application, project) {
        }
    });

    Factory.extend = Backbone.Model.extend;

    return Factory;
});
