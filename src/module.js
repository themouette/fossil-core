define([
    'fossil/core',
    'underscore',
    'backbone',
    'fossil/mixins/events',
    'fossil/mixins/layout',
    'fossil/mixins/fragmentable'
], function (Fossil, _, Backbone) {

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
        // init fragmentable
        this.initFragmentable();
        // finally call initialize method
        this.initialize.call(this, application);
    };

    _.extend(Module.prototype, Fossil.Mixins.Events, Fossil.Mixins.Layout, Fossil.Mixins.Fragmentable, {
        // events bound on application PubSub
        applicationEvents: {},
        // events bound on module PubSub
        events: {},
        initialize: function (application) {

        },
        // called when module is selected.
        // this is what the setup phase is about.
        setup: function (application) {
            this.renderLayout(application.$('[data-fossil-placeholder=module]'));
            this.trigger('setup');
        },
        // called when selected module is changing.
        // this is used to terminate current module before
        // the new one is setup.
        teardown: function (application) {
            this.removeLayout();
            this.trigger('teardown');
        }
    });

    Module.extend = Backbone.Model.extend;

    return Module;
});
