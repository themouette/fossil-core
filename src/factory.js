define([
    'fossil/core',
    'fossil/mixins/events',
    'underscore',
    'backbone'
], function (Fossil, Events, _, Backbone) {

    Fossil.Factories = {};

    var Factory = Fossil.Factory = function (options) {
        this.options = _.extend({}, this.options, options || {});
        this.registerEvents();
        this.initialize.apply(this, arguments);
    };

    _.extend(Factory.prototype, Fossil.Mixins.Events, {
        // default options
        options: {
            // should the factory be exposed  to module context ?
            // an exposed factory will be available under module.factories[factoryid]
            exposeToModule: false,
            // should there be a shortlink on module
            // this would make factory available under module[factoryid]
            // to avoid conflic this MUST be set by user.
            linkToApplcation: false
        },
        // A hook to initialize factory,
        // after application and modules are initialized.
        initialize: function (options) {
        },

        // activate Factory for application
        activateApplication: function (application, id) {
            var factory = this;
            this.prefixEvent = _.bind(prefixEvent, this, id);

            // create pubSub
            this.application = application.createPubSub(this, 'applicationEvents');
            // activate application
            this._doActivateApplication(application);
            // activate all modules
            _.each(application.getModule(), function (module) {
                factory.activateModule.call(factory, module, application, id);
            });
            // register on new module connection
            this.listenTo(application, 'module:connect', _.bind(this.activateModuleListener, this, id));
            // tell the world we're ready
            application.trigger(this.prefixEvent('ready'), this);
        },
        // unplug for application
        suspendApplication: function (application, id) {
            var factory = this;
            // suspend for every application modules
            _.each(application.getModule(), function (module) {
                factory.suspendModule.call(factory, module, application, id);
            });
            // remove event handler
            this.stopListening();
            // remove pubsub reference
            this.application = null;
            // finally suspend for application
            this._doSuspendApplication(application);
        },

        activateModule: function (module, application, id) {
            if (!module.factories) {
                // module isn't booted yet.
                return ;
            }
            if (this.options.exposeToModule) {
                module.factories[id] = this;
            }
            if (this.options.linkToApplcation) {
                module[id] = this;
            }
            this._doActivateModule.apply(this, arguments);
            module.trigger(this.prefixEvent('ready'), this);
        },
        suspendModule: function (module, application, id) {
            if (this.options.exposeToModule) {
                module.factories[id] = null;
            }
            this._doSuspendModule.apply(this, arguments);
        },

        activateModuleListener: function (id, module, path, application) {
            this.activateModule(module, application, id);
        },

        // activate factory on application.
        // this method has to be overriden with the factory logic.
        _doActivateApplication: function (application) {
        },
        // activate factory on module.
        // this method has to be overriden with the factory logic.
        _doActivateModule: function (module, application) {
        },
        // suspend factory on application.
        // this method has to be overriden with the factory logic.
        _doSuspendApplication: function (application) {
        },
        // suspend factory on module.
        // this method has to be overriden with the factory logic.
        _doSuspendModule: function (module, application) {
        }
    });

    function prefixEvent (id, event) {
        return ['factory', id, event].join(':');
    }

    Factory.extend = Backbone.Model.extend;

    return Factory;
});
