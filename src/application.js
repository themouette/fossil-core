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
        // init event listeners
        initEventListeners(project, this);
        // finally call initialize method
        this.initialize.call(this, project);
    };

    _.extend(Application.prototype, Backbone.Events, {
        initialize: function (project) {

        }
    });

    function initEventListeners (project, application) {
        // listen to project events
        application.listenTo(project, 'application:change', this.onApplicationChange, this);
    }

    Application.extend = Backbone.Model.extend;

    return Application;
});
