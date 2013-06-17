define([
    'fossil/core',
    'underscore',
    'backbone'
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
        this.application = application.createPubSub();
        // init factories namespace
        this.factories = {};
        // init event listeners
        initEventListeners(this);
        // finally call initialize method
        this.initialize.call(this, application);
    };

    _.extend(Module.prototype, Backbone.Events, {
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
        },
        // called when selected module is changing.
        // this is used to terminate current module before
        // the new one is setup.
        teardown: function () {
            this.trigger('teardown');
        },
    });

    function initEventListeners (module) {
        initApplicationEvents(module);
        initModuleEvents(module);
    }
    function initApplicationEvents (module) {
        var events;
        // listen to application events
        events = _.extend(
            module.applicationEvents || {},
            module.options.applicationEvents || {}
        );
        _.each(events, function (method, eventId) {
            if (!_.isFunction(method)) {
                method = module[method];
            }
            module.listenTo(module.application, eventId, method, module);
        });
    }
    // listen to module events
    function initModuleEvents (module) {
        var events;
        events = _.extend(
            module.events || {},
            module.options.events || {}
        );
        _.each(events, function (method, eventId) {
            if (!_.isFunction(method)) {
                method = module[method];
            }
            module.listenTo(module, eventId, method, module);
        });
    }

    Module.extend = Backbone.Model.extend;

    return Module;
});
