define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {

    var Application = Fossil.Application = function (project, path, options) {
        if (typeof path === "string") {
            this.path = path;
            this.options = options || {};
        } else {
            options = path || {};
            this.path = options.path || '';
            this.options = options;
        }

        // a PubSub object fo communication with the project
        this.project = project.createPubSub();
        // init factories namespace
        this.factories = {};
        // init event listeners
        initEventListeners(this);
        // finally call initialize method
        this.initialize.call(this, project);
    };

    _.extend(Application.prototype, Backbone.Events, {
        // events bound on project PubSub
        projectEvents: {},
        // events bound on application PubSub
        events: {},
        initialize: function (project) {

        },
        // called when application is selected.
        // this is what the setup phase is about.
        setup: function () {
            this.trigger('setup');
        },
        // called when selected application is changing.
        // this is used to terminate current application before
        // the new one is setup.
        teardown: function () {
            this.trigger('teardown');
        },
    });

    function initEventListeners (application) {
        initProjectEvents(application);
        initApplicationEvents(application);
    }
    function initProjectEvents (application) {
        var events;
        // listen to project events
        events = _.extend(
            application.projectEvents || {},
            application.options.projectEvents || {}
        );
        _.each(events, function (method, eventId) {
            if (!_.isFunction(method)) {
                method = application[method];
            }
            application.listenTo(application.project, eventId, method, application);
        });
    }
    // listen to application events
    function initApplicationEvents (application) {
        var events;
        events = _.extend(
            application.events || {},
            application.options.events || {}
        );
        _.each(events, function (method, eventId) {
            if (!_.isFunction(method)) {
                method = application[method];
            }
            application.listenTo(application, eventId, method, application);
        });
    }

    Application.extend = Backbone.Model.extend;

    return Application;
});
