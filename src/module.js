define([
    'fossil/core',
    'fossil/mixins/events',
    'underscore',
    'backbone'
], function (Fossil, Events, _, Backbone) {

    var Module = Fossil.Module = function (application, path, options) {
        if (typeof path === "string") {
            this.path = path;
            this.options = options || {};
        } else {
            options = path || {};
            this.path = options.path || '';
            this.options = options;
        }

        // a PubSub object fo communication with the application
        this.application = application.createPubSub(this, 'applicationEvents');
        // init factories namespace
        this.factories = {};
        // init event listeners
        this.registerEvents();
        // finally call initialize method
        this.initialize.call(this, application);
    };

    _.extend(Module.prototype, Fossil.Mixins.Events, {
        // events bound on application PubSub
        applicationEvents: {},
        // events bound on module PubSub
        events: {},
        initialize: function (application) {

        },
        // called when module is selected.
        // this is what the setup phase is about.
        setup: function () {
            this.trigger('setup');
            this.trigger('setup:layout');
            this.trigger('setup:fragments');
        },
        // called when selected module is changing.
        // this is used to terminate current module before
        // the new one is setup.
        teardown: function () {
            this.trigger('teardown:fragments');
            this.trigger('teardown:layout');
            this.trigger('teardown');
        }
    });

    Module.extend = Backbone.Model.extend;

    return Module;
});
