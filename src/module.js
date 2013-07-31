Fossil.Module = (function (Fossil, _, Backbone) {
    'use strict';

    var Module = function (options) {
        this.options = options || {};
        if (typeof this.options.path === "string") {
            this.path = _.result(this.options, 'path');
        }

        // init event listeners
        this.registerEvents();
        // init layoutable
        this.initLayoutable();
        // init fragmentable
        this.initFragmentable();
        // finally call initialize method
        this.initialize.call(this);
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
            initialize: function () {},
            registerEvents: function () {
                Fossil.Mixins.Observable.registerEvents.call(this);
                this.listenTo(this, 'connect', _.bind(this.connectListener, this));
            },
            connectListener: function (application, id) {
                // a PubSub object to communicate with the application
                this.application = application.createPubSub(this, 'applicationEvents');
                // if not already defined
                if (typeof this.path !== "string") {
                    this.path = id;
                }
                // link services
                this.services = application.services;
                // start and stop when element is set or unset
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
            render: function () {
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
