define([
    'underscore', './utils', './mixin', './mixins/observable'
], function (_, utils, Mixin, Observable) {
    'use strict';

    var Service = Mixin.extend({
        // should the service methods be exposed  to module context ?
        // an exposed methods will be exposed under app[serviceMethod]
        expose: null,
        // should there be a shortlink on module
        // this would make service available under application[serviceid]
        // to avoid conflic this MUST be set by user.
        link: null,
        // should the service be propagated to submodules ?
        // if yes, then all submodules will use the service.
        useDeep: null,

        // Callback for developer to implement service logic for module use.
        use: function (module, parent) {
            // do something amazing
        },

        // Callback for developer to implement service logic for module disposal.
        dispose: function (module, parent) {
            // do something amazing
        },

        constructor: function (options) {
            // call parent constructor
            Mixin.apply(this, arguments);

            // copy options to main object
            utils.copyOption(['link', 'expose', 'useDeep'], this, options);

            this.on('do:use:module', this.doUseModuleListener, this);
            this.on('do:dispose:module', this.doDisposeModuleListener, this);

            // call initialize
            if (typeof(this.initialize) === "function") {
                this.initialize.apply(this, arguments);
            }
        },

        // Service listener on the do:use:module command.
        //
        // It calls the `use` method. If `useDeep` is true, then it uses
        // service for every submodule, present or to be registered.
        doUseModuleListener: function (module, serviceid, service) {
            use(this, serviceid, module);
        },

        // Service listener on the do:dispose:module command.
        //
        // It calls the `dispose` method. If `disposeDeep` is true, then it
        // disposes service for every submodule, and unregister event listeners.
        doDisposeModuleListener: function (module, serviceid, service) {
            dispose(this, serviceid, module);
        },

        // Module listener for on:child:connect event
        //
        // This is the way newly registered submodules are using service.
        onChildConnectListener: function (serviceid, child, childid, parent) {
            use(this, serviceid, child, parent, childid);
        },

        // Module listener for on:child:disconnect event
        //
        // This is the way disconnected submodules are disposing service.
        onChildDisconnectListener: function (serviceid, child, childid, parent) {
            dispose(this, serviceid, child, parent, childid);
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
        }

    });

    Service.mix(Observable);

    function use(service, serviceid, module, parent, childid) {
        if (_.result(service, 'link')) {
            service.doExpose(module, serviceid);
        }
        if (_.result(service, 'expose')) {
            service.doExpose(module, serviceid);
        }
        service.use(module, parent, childid);
        if (service.useDeep) {
            _.each(module.modules, function (submodule, childid) {
                use(service, serviceid, submodule, module, childid);
            }, service);
            // listen to events and forward serviceid
            module.on('on:child:connect', _.bind(service.onChildConnectListener, service, serviceid));
            module.on('on:child:disconnect', _.bind(service.onChildDisconnectListener, service, serviceid));
        }
    }

    function dispose(service, serviceid, module, parent, childid) {
        if (_.result(service, 'link')) {
            service.undoLink(module, serviceid);
        }
        if (_.result(service, 'expose')) {
            service.undoExpose(module, serviceid);
        }
        if (service.useDeep) {
            _.each(module.modules, function (submodule, childid) {
                dispose(service, serviceid, submodule, module, childid);
            }, service);
            module.off('on:child:connect', null, service);
            module.off('on:child:disconnect', null, service);
        }
        service.dispose(module, parent, childid);
    }

    return Service;
});
