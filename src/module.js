Fossil.Module = (function (Fossil, _, Backbone) {
    'use strict';

    var Module = function (application, path, options) {
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
        // init services namespace
        this.services = {};
        // init event listeners
        this.registerEvents(application);
        // init fragmentable
        this.initFragmentable();
        // finally call initialize method
        this.initialize.call(this, application);
    };

    _.extend(Module.prototype,
        Fossil.Mixins.Observable,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layoutable,
        Fossil.Mixins.Fragmentable,
        Fossil.Mixins.Deferrable,
        Fossil.Mixins.Startable, {
            // events bound on application PubSub
            applicationEvents: {},
            // events bound on module PubSub
            events: {},
            initialize: function (application) {

            },
            registerEvents: function (application) {
                Fossil.Mixins.Observable.registerEvents.call(this);
                this.listenTo(this, 'elementable:attach', _.bind(this.elementAttachListener, this, application));
                this.listenTo(this, 'elementable:detach', _.bind(this.elementDetachListener, this, application));
            },
            elementAttachListener: function (application) {
                this.start();
                this.thenWith(this, this.render);
            },
            elementDetachListener: function (application) {
                this.standby();
            },
            render: function (application) {
                this.renderLayout();
                this.renderFragments();
            },
            // called when selected module is changing.
            // this is used to terminate current module before
            // the new one is setup.
            _doStandby: function (application) {
                Fossil.Mixins.Startable._doStandby.apply(this, arguments);
                this.removeFragments();
                this.removeLayout();
            }
    });

    Module.extend = Backbone.Model.extend;

    return Module;
})(Fossil, _, Backbone);
