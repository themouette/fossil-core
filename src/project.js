define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {

    var messages = {
        unknown_application: _.template("Unknown application at \"<%- path %>\".")
    };

    var Project = Fossil.Project = function (options) {
        this.options = options || {};
        initEventListeners(this);
        initFactories(this);
        initApplications(this);
        this.initialize.apply(this, arguments);
    };

    _.extend(Project.prototype, Backbone.Events, {
        initialize: function () {
        },

        // connect an application at given subpath
        connect: function (path, application) {
            if (_.isFunction(application)) {
                application = new application(this, path);
            }
            this.applications[path] = application;
            this.trigger('application:connect', application, path, this);

            return this;
        },
        // retreive an application from it's path
        // or returns all applications if no path is given.
        getApplication: function (path) {
            if (typeof path === "undefined") {
                return this.applications;
            }
            if (this.applications[path]) {
                return this.applications[path];
            }

            throw new Error(messages.unknown_application({path: path}));
        },

        // use a factory
        use: function (id, factory) {
            if (_.isFunction(factory)) {
                factory = new factory();
            }
            // suspend previously registered factory with this name
            if (this.factories[id]) {
                this.factories[id].suspendProject(this, id);
            }
            factory.activateProject(this, id);
            this.factories[id] = factory;
            this.trigger('factory:use', factory, id, this);

            return this;
        },

        // expose project's PubSub to plug it in project.
        createPubSub: function () {
            var pubsub = {}, project = this;
            _.each(['on', 'off', 'trigger'], function (method) {
                pubsub[method] = _.bind(project[method], project);
            });

            return pubsub;
        }
    });

    function initFactories (project) {
        var factories = _.extend(
            {},
            project.factories || {},
            project.options.factories || {}
        );
        project.factories = {};
        _.each(factories, function (factory, id) {
            project.use(id, factory);
        });
    }

    function initApplications (project) {
        var apps = _.extend(
            {},
            project.applications || {},
            project.options.applications || {}
        );
        project.applications = {};
        _.each(apps, function (application, path) {
            project.connect(path, application);
        });
    }

    function initEventListeners (project) {
        var events = _.extend(
            {},
            _.result(project, 'events'),
            _.result(project.options, 'events')
        );
        _.each(events, function (callback, eventname) {
            if (!_.isFunction(callback)) {
                callback = project[callback];
            }
            if (callback) {
                project.listenTo(project, eventname, callback, project);
            }
        });
    }

    Project.extend = Backbone.Model.extend;

    return Project;
});
