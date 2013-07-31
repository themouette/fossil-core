Fossil.Service = (function (Fossil, _, Backbone) {
    'use strict';

    Fossil.Services = {};

    var Service = function (options) {
        this.options = _.extend({}, this.options, options || {});
        this.registerEvents();
        this.initialize.apply(this, arguments);
    };

    _.extend(Service.prototype, Fossil.Mixins.Observable, {
        // create a link to those methods in every element exposed
        // to the service
        // @array
        exposedMethods: null,

        // default options
        options: {
            // default configuration for service methods exposure
            expose: false,
            // default configuration for service link
            link: false,
            // should the service methods be exposed  to app context ?
            // an exposed methods will be exposed under app[serviceMethod]
            exposeToApplication: null,
            // should there be a shortlink on application
            // this would make service available under application[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToApplication: null,
            // should the service methods be exposed  to module context ?
            // an exposed methods will be exposed under module[serviceMethod]
            exposeToModule: null,
            // should there be a shortlink on module
            // this would make service available under module[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToModule: null,
            // should the service methods be exposed to fragement context ?
            // an exposed methoods will be available under fragement[serviceMethod]
            exposeToFragment: null,
            // should there be a shortlink on fragement
            // this would make service available under fragement[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToFragment: null
        },
        // A hook to initialize service,
        // after application and modules are initialized.
        initialize: function (options) {
        },

        // activate Service for application
        activateApplication: function (application, id) {
            var service = this;
            this.prefixEvent = _.bind(prefixEvent, this, id);
            if (processConfig(this, 'exposeToApplication', 'expose')) {
                this.doExpose(application, id);
            }
            if (processConfig(this, 'linkToApplication', 'link')) {
                this.undoLink(application, id);
            }

            // create pubSub
            this.application = application.createPubSub(this, 'applicationEvents');
            // activate application
            this._doActivateApplication(application);
            // activate all modules
            _.each(application.getModule(), function (module) {
                service.activateModule.call(service, module, application, id);
            });
            // register on new module connection
            this.listenTo(application, 'module:connect', _.bind(this.activateModuleListener, this, id));
            this.listenTo(application, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            // tell the world we're ready
            application.trigger(this.prefixEvent('ready'), this);
        },
        // unplug for application
        suspendApplication: function (application, id) {
            var service = this;
            // suspend for every application modules
            _.each(application.getModule(), function (module) {
                service.suspendModule.call(service, module, application, id);
            });
            if (processConfig(this, 'exposeToApplication', 'expose')) {
                this.undoExpose(application, id);
            }
            if (processConfig(this, 'linkToApplication', 'link')) {
                this.undoLink(application, id);
            }
            // remove event handler
            this.stopListening();
            // remove pubsub reference
            this.application = null;
            // finally suspend for application
            this._doSuspendApplication(application);
        },

        activateModule: function (module, application, id) {
            if (!module.services) {
                // module isn't booted yet.
                return ;
            }
            if (processConfig(this, 'exposeToModule', 'expose')) {
                this.doExpose(module, id);
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                this.doLink(module, id);
            }
            this._doActivateModule.apply(this, arguments);
            this.listenTo(module, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            module.trigger(this.prefixEvent('ready'), this);
        },
        suspendModule: function (module, application, id) {
            if (processConfig(this, 'exposeToModule', 'expose')) {
                this.undoExpose(module, id);
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                this.undoLink(module, id);
            }
            this._doSuspendModule.apply(this, arguments);
        },
        activateModuleListener: function (id, module, path, application) {
            this.activateModule(module, application, id);
        },

        activateFragment: function (fragment, parent, id) {
            if (!fragment.services) {
                // fragment isn't booted yet.
                return ;
            }
            if (processConfig(this, 'exposeToFragment', 'expose')) {
                this.doExpose(fragment, id);
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                this.doLink(fragment, id);
            }
            this._doActivateFragment.apply(this, arguments);
            this.listenTo(fragment, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            fragment.trigger(this.prefixEvent('ready'), this);
        },
        suspendFragment: function (fragment, parent, id) {
            if (processConfig(this, 'exposeToFragment', 'expose')) {
                this.undoExpose(fragment, id);
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                this.undoLink(fragment, id);
            }
            this._doSuspendFragment.apply(this, arguments);
        },
        activateFragmentListener: function (id, fragment, parent) {
            this.activateFragment(fragment, parent, id);
        },

        doLink: function (element, serviceid) {
            element[serviceid] = this;
        },
        undoLink: function (element, serviceid) {
            element[serviceid] = null;
        },
        doExpose: function (element, serviceid) {
            var service = this;
            _.each(this.exposedMethods, function (methodname) {
                element[methodname] = _.bind(service[methodname], service);
            });
        },
        undoExpose: function (element, serviceid) {
            _.each(this.exposedMethods, function (methodname) {
                element[methodname] = null;
            });
        },

        // activate service on application.
        // this method has to be overriden with the service logic.
        _doActivateApplication: function (application) {
        },
        // activate service on module.
        // this method has to be overriden with the service logic.
        _doActivateModule: function (module, application) {
        },
        // activate service on fragment.
        // this method has to be overriden with the service logic.
        _doActivateFragment: function (fragment, parent) {
        },
        // suspend service on application.
        // this method has to be overriden with the service logic.
        _doSuspendApplication: function (application) {
        },
        // suspend service on module.
        // this method has to be overriden with the service logic.
        _doSuspendModule: function (module, application) {
        },
        // suspend service on fragment.
        // this method has to be overriden with the service logic.
        _doSuspendFragment: function (fragment, parent) {
        }
    });

    function prefixEvent (id, event) {
        return ['service', id, event].join(':');
    }

    function processConfig(service, prop, defaultProp) {
        prop = _.result(service.options, prop);
        if (prop !== null) {
            return prop;
        }

        return _.result(service.options, defaultProp);
    }

    Service.extend = function () {
        var options = this.prototype.options;
        var child = Backbone.Model.extend.apply(this, arguments);
        child.prototype.options = _.extend({}, this.prototype.options, child.prototype.options ||{});
        return child;
    };

    return Service;
})(Fossil, _, Backbone);
