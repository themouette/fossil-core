define([
    'fossil/core',
    'underscore',
    'backbone',
    'fossil/mixins/events',
    'fossil/mixins/layoutable',
    'fossil/mixins/elementable',
    'fossil/mixins/fragmentable',
    'fossil/mixins/deferrable'
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

        // a PubSub object for communication with the application
        this.application = application.createPubSub(this, 'applicationEvents');
        // init factories namespace
        this.factories = {};
        // init event listeners
        this.registerEvents(application);
        // init fragmentable
        this.initFragmentable();
        // finally call initialize method
        this.initialize.call(this, application);
    };

    _.extend(Module.prototype,
        Fossil.Mixins.Events,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layoutable,
        Fossil.Mixins.Fragmentable,
        Fossil.Mixins.Deferrable, {
            // events bound on application PubSub
            applicationEvents: {},
            // events bound on module PubSub
            events: {},
            initialize: function (application) {

            },
            registerEvents: function (application) {
                Fossil.Mixins.Events.registerEvents.call(this);
                this.listenTo(this, 'elementable:attach', _.bind(this.elementAttachListener, this, application));
                this.listenTo(this, 'elementable:detach', _.bind(this.elementDetachListener, this, application));
            },
            elementAttachListener: function (application) {
                this.setup(application);
            },
            elementDetachListener: function (application) {
                this.teardown(application);
            },
            // called when module is selected.
            // this is what the setup phase is about.
            setup: function (application) {
                this.deferred();
                this.trigger('setup', this, application);
                this.then(_.bind(this.render, this, application));
                this.resolve();
            },
            render: function (application) {
                this.renderLayout();
                this.renderFragments();
                this.trigger('start', this);
            },
            // called when selected module is changing.
            // this is used to terminate current module before
            // the new one is setup.
            teardown: function (application) {
                this.removeFragments();
                this.removeLayout();
                this.trigger('teardown', this, application);
            }
    });

    Module.extend = Backbone.Model.extend;

    return Module;
});
