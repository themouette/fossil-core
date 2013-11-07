// Wrap observable callback to handle `parent!` event modifier.
//
// To manipulate parent events, it is possible to use traditional
// observable method, just prefix the event with `parent!`.
//
// ``` js
// module.on('parent!do:execute:command', function () {}, this);
// ```
define([
    'underscore', 'backbone', './utils', './mixin',
    './mixins/observable', './mixins/deferrable', './mixins/startable', './observableBuffer',
    'fossil/views/view'
], function (_, Backbone, utils, Mixin, Observable, Deferrable, Startable, ObservableBuffer, View) {
    'use strict';

    var messages = {
        invalid_arguments: 'You must provide `id` and `module` arguments.'
    };

    var Module = Mixin.extend({
        // should the module start when it's parent starts ?
        //
        // if true, then module will be auto started whenever the parent will
        // start.
        startWithParent: false,

        constructor: function (options) {
            this.modules = {};
            this.services = [];
            this.options = options;


            // create a stub observable for parent.
            this.parent = new ObservableBuffer();

            // call parent constructor
            Mixin.apply(this, arguments);

            // copy options to main object
            utils.copyOption(['startWithParent'], this, options);

            // initialize some events
            this.on('start', this.startListener, this);
            this.on('standby', this.standbyListener, this);
            this.on('stop', this.stopListener, this);

            // call initialize
            if (typeof(this.initialize) === "function") {
                this.initialize.apply(this, arguments);
            }
        },

        initializeEventModifiers: function () {
            Observable.initializeEventModifiers.apply(this, arguments);
            // add event modifier
            this.addEventModifier('parent', parentEvent, ['trigger', 'on', 'off', 'once']);
        },

        // Use this to navigate to a url.
        // An event is triggered and should be handled by
        // a dedicated service.
        // It forwards extra arguments and prepend the module.
        //
        // ``` js
        // module.navigate(); // will pass `(module)` to handlers.
        // module.navigate('foo'); // will pass `(module, 'foo')` to handlers.
        // ```
        //
        // @triggers 'do:route:navigate'
        navigate: function () {
            var args = _.toArray(arguments);
            this.trigger.apply(this, ['do:route:navigate', this].concat(args));

            return this;
        },
        // Use this to register a new route.
        // An event is triggered and should be handled by
        // a dedicated service.
        // It forwards extra arguments and prepend the module.
        //
        // ``` js
        // module.route(); // will pass `(module)` to handlers.
        // module.route('foo'); // will pass `(module, 'foo')` to handlers.
        // ```
        //
        // @triggers 'do:route:register'
        route: function () {
            var args = _.toArray(arguments);
            this.trigger.apply(this, ['do:route:register', this].concat(args));

            return this;
        },

        // Use this to render given view.
        // An event is triggered and should be handled by
        // a dedicated service.
        // It forwards extra arguments and prepend the module.
        //
        // ``` js
        // module.render(view); // will pass `(module, view)` to handlers.
        // module.render(view, extra); // will pass `(module, view, extra)` to handlers.
        // ```
        //
        // @triggers 'do:view:render'
        render: function () {
            var args = _.toArray(arguments);
            this.trigger.apply(this, ['do:view:render', this].concat(args));

            return this;
        },
        // Use this to attach given view to DOM.
        // An event is triggered and should be handled by
        // a dedicated service.
        // It forwards extra arguments and prepend the module.
        //
        // ``` js
        // module.attach(view); // will pass `(module, view)` to handlers.
        // module.attach(view, extra); // will pass `(module, view, extra)` to handlers.
        // ```
        //
        // @triggers 'do:view:attach'
        attach: function () {
            var args = _.toArray(arguments);
            this.trigger.apply(this, ['do:view:attach', this].concat(args));

            return this;
        },
        // Use this to replace current view.
        // If view is not marked as `recycle` and `_rendered`
        // view will first be rendered using the `render` method.
        // View is then attached using `attach` method.
        //
        // It forwards extra arguments and prepend the module.
        //
        // ``` js
        // module.useView(view); // will render and attach view
        // ```
        //
        // @see Module#render
        // @see Module#attach
        useView: function (view) {
            var args;
            if (typeof(view) === "string") {
                view = new View({template: view});
            }

            args = [view].concat(_.rest(arguments, 1));

            if (view && !(view.recycle && view._rendered)) {
                this.render.apply(this, args);
            }

            this.attach.apply(this, args);

            return this;
        },

        // Replaces current view once all deferred are processed.
        // If all promises went right, then `viewOk` will be used
        // and otherwise `viewKo` will be used.
        thenUseView: function (viewOk, viewKo) {
            this.then(
                viewOk ? _.bind(this.useView, this, viewOk) : null,
                viewKo ? _.bind(this.useView, this, viewKo) : null
            );

            return this;
        },

        // Connect a new submodule.
        //
        // Child module will trigger 'do:connect:to:parent' event.
        // It accepts `function (parent, id, child) {}` and receive extra
        // parameters as well.
        //
        // Note that if a module is previously connected under the same id,
        // then it will first be disconnected.
        //
        // ``` js
        // var module = new Module();
        // var child = new Module();
        //
        // child.on('do:connect:to:parent', function (parent, id, child) {});
        // module.on('on:child:connect', function (child, id, parent) {});
        //
        // module.connect('child', child);
        // ```
        //
        // @triggers 'on:child:connect'
        connect: utils.keyValueOrObject(function (id, module) {
            var extra = _.tail(arguments, 2);

            if (this.modules[id]) {
                this.disconnect(id);
            }

            // register a reference of the module
            this.modules[id] = module;
            // replace and replay observable
            var pubsub = this.createPubSub();
            module.parent.replay(pubsub);
            module.parent = pubsub;

            // trigger connect on child
            if (module.trigger) {
                module.trigger.apply(module, ['do:connect:to:parent', this, id, module].concat(extra));
            }

            // then on parent module
            this.trigger.apply(this, ['on:child:connect', module, id, this].concat(extra));

            return this;
        }),

        // Disconnects a module by it's id.
        //
        // Child module will trigger 'do:disconnect:from:parent' event.
        // It accepts `function (parent, id, child) {}` and receive extra
        // parameters as well.
        //
        // ``` js
        // var module = new Module();
        // var child = new Module();
        //
        // child.on('do:disconnect:from:parent', function (parent, id, child) {});
        // module.on('on:child:disconnect', function (child, id, parent) {});
        //
        // module.connect('child', child);
        // module.disconnect('child', child);
        // ```
        //
        // @triggers 'on:child:disconnect'
        disconnect: utils.scalarOrArray(function (id) {
            var extra = _.tail(arguments);
            var child = this.modules[id];
            // nothing to disconnect ?
            if (!child) {
                return this;
            }

            // stub the module's parent observable
            child.parent = new ObservableBuffer();

            // trigger disconnect on child
            if (child.trigger) {
                child.trigger.apply(child, ['do:disconnect:from:parent', this, id, child].concat(extra));
            }

            // then on parent
            this.trigger.apply(this, ['on:child:disconnect', child, id, this].concat(extra));

            return this;
        }),

        // Declare a service for `id`.
        //
        // This new service hooks into this module only.
        // to hook into all submodules registered or to be registered, you must
        // handle this at the service level.
        //
        // It is advised for services to offer a single option `deepUse` to
        // turn on and off the ability to register deeply.
        //
        // 'do:use:module' command is triggered on service as long as it
        // provides a `trigger` method.
        // This command accepts callbacks `function (module, id, service) {}`
        // and forwards extra arguments.
        //
        // In case a service with the same id is already in use, it will be
        // disposed.
        //
        // ``` js
        // module.use('foo', new Service());
        // ```
        //
        // @triggers 'on:service:use'
        use: utils.keyValueOrObject(function (id, service) {
            var extra = _.tail(arguments, 2);
            // suspend previously registered service with this name
            if (this.services[id]) {
                this.dispose(id);
            }

            // register a reference of the service
            this.services[id] = service;

            // trigger connect on child
            if (service.trigger) {
                service.trigger.apply(service, ['do:use:module', this, id, service].concat(extra));
            }

            // then on parent service
            this.trigger.apply(this, ['on:service:use', service, id, this].concat(extra));

            return this;
        }),

        // Unregister service `id`
        //
        // This service hooks should be removed by the service.
        //
        // It is advised for services to offer a single option `deepUse` to
        // turn on and off the ability to register deeply.
        //
        // 'do:dispose:module' command is triggered on service as long as it
        // provides a `trigger` method.
        // This command accepts callbacks `function (module, id, service) {}`
        // and forwards extra arguments.
        //
        // ``` js
        // module.use('foo', new Service());
        // module.dispose('foo');
        // ```
        //
        // @triggers 'on:service:dispose'
        dispose: utils.scalarOrArray(function (id) {
            var extra = _.tail(arguments);
            var service = this.services[id];
            // nothing to disconnect ?
            if (!service) {
                return this;
            }

            // nothing more to do yet, but
            // here come the service switch off code.

            // trigger disconnect on service
            if (service.trigger) {
                service.trigger.apply(service, ['do:dispose:module', this, id, service].concat(extra));
            }

            // then on parent
            this.trigger.apply(this, ['on:service:dispose', service, id, this].concat(extra));

            return this;
        }),

        // for every module that should start with parent
        startListener: function () {
            _.each(this.modules, function (module) {
                if (module.startWithParent) {
                    module.start();
                }
            }, this);
        },

        // standby all submodules
        standbyListener: function () {
            _.each(this.modules, function (module) {
                module.standby();
            }, this);
        },

        // stop all submodules
        stopListener: function () {
            _.each(this.modules, function (module) {
                module.stop();
            }, this);
        }
    });

    // envent modifier for parent!
    function parentEvent(obj, method, eventname, extra) {
        obj.parent[method].apply(obj.parent, [eventname].concat(extra));

        return obj;
    }
    // note that listenTo, listenToOnce and stopListening relies on other
    // methods so there is no need to extend them.

    Module.mix([Observable, Deferrable, Startable]);

    return Module;
});
