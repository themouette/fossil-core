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
        options: {},
        // A hook to initialize factory,
        // after project and applications are initialized.
        initialize: function (options) {
        },

        // activate Factory for project
        activateProject: function (project) {
            var factory = this;

            // create pubSub
            this.project = project.createPubSub();
            // activate project
            this._doActivateProject(project);
            // activate all applications
            _.each(project.getApplication(), function (application) {
                factory.activateApplication.call(factory, application, project);
            });
            // register on new application connection
            this.project.on('application:connect', this.activateApplicationListener, this);
        },
        // unplug for project
        suspendProject: function (project) {
            var factory = this;
            // suspend for every project applications
            _.each(project.getApplication(), function (application) {
                factory.suspendApplication.call(factory, application, project);
            });
            // remove event handler
            this.project.off('application:connect', this.activateApplicationListener, this);
            // remove pubsub reference
            this.project = null;
            // finally suspend for project
            this._doSuspendProject(project);
        },

        activateApplication: function (application, project) {
            this._doActivateApplication.apply(this, arguments);
        },
        suspendApplication: function (application, project) {
            this._doSuspendApplication.apply(this, arguments);
        },

        activateApplicationListener: function (application, path, project) {
            this.activateApplication(application, project);
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
