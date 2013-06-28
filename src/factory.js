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
            // default configuration for service exposure
            expose: false,
            // default configuration for service link
            link: false,
            // should the factory be exposed to module context?
            // an exposed factory will be available under module.factories[factoryid]
            exposeToModule: null,
            // should there be a shortlink on module
            // this would make factory available under module[factoryid]
            // to avoid conflic this MUST be set by user.
            linkToModule: null,
            // should the factory be exposed to fragement context?
            // an exposed factory will be available under fragement.factories[factoryid]
            exposeToFragment: null,
            // should there be a shortlink on fragement
            // this would make factory available under fragement[factoryid]
            // to avoid conflic this MUST be set by user.
            linkToFragment: null
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
            this.listenTo(application, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
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
            if (processConfig(this, 'exposeToModule', 'expose')) {
                module.factories[id] = this;
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                module[id] = this;
            }
            this._doActivateModule.apply(this, arguments);
            this.listenTo(module, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            module.trigger(this.prefixEvent('ready'), this);
        },
        suspendModule: function (module, application, id) {
            if (processConfig(this, 'exposeToModule', 'expose')) {
                module.factories[id] = null;
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                module[id] = null;
            }
            this._doSuspendModule.apply(this, arguments);
        },
        activateModuleListener: function (id, module, path, application) {
            this.activateModule(module, application, id);
        },

        activateFragment: function (fragment, parent, id) {
            if (!fragment.factories) {
                // fragment isn't booted yet.
                return ;
            }
            if (processConfig(this, 'exposeToFragment', 'expose')) {
                fragment.factories[id] = this;
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                fragment[id] = this;
            }
            this._doActivateFragment.apply(this, arguments);
            this.listenTo(fragment, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            fragment.trigger(this.prefixEvent('ready'), this);
        },
        suspendFragment: function (fragment, parent, id) {
            if (processConfig(this, 'exposeToFragment', 'expose')) {
                fragment.factories[id] = null;
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                fragment[id] = null;
            }
            this._doSuspendFragment.apply(this, arguments);
        },
        activateFragmentListener: function (id, fragment, parent) {
            this.activateFragment(fragment, parent, id);
        },

        // activate factory on application.
        // this method has to be overriden with the factory logic.
        _doActivateApplication: function (application) {
        },
        // activate factory on module.
        // this method has to be overriden with the factory logic.
        _doActivateModule: function (module, application) {
        },
        // activate factory on fragment.
        // this method has to be overriden with the factory logic.
        _doActivateFragment: function (fragment, parent) {
        },
        // suspend factory on application.
        // this method has to be overriden with the factory logic.
        _doSuspendApplication: function (application) {
        },
        // suspend factory on module.
        // this method has to be overriden with the factory logic.
        _doSuspendModule: function (module, application) {
        },
        // suspend factory on fragment.
        // this method has to be overriden with the factory logic.
        _doSuspendFragment: function (fragment, parent) {
        }
    });

    function prefixEvent (id, event) {
        return ['factory', id, event].join(':');
    }

    function processConfig(service, prop, defaultProp) {
        prop = _.result(service.options, prop);
        if (prop !== null) {
            return prop;
        }

        return _.result(service.options, defaultProp);
    }

    Factory.extend = function () {
        var options = this.prototype.options;
        var child = Backbone.Model.extend.apply(this, arguments);
        child.prototype.options = _.extend({}, this.prototype.options, child.prototype.options ||{});
        return child;
    };

    return Factory;
});
