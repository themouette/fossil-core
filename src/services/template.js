define(['underscore', '../utils', '../service'], function (_, utils, Service) {
    var Template = Service.extend({
        // engine in use
        engine: null,
        // use on every submodule
        useDeep: true,

        // copy engine option and call parent.
        // last, engine is started.
        //
        // If you need to stop the engine, it should be done manually.
        constructor: function (options) {
            utils.copyOption(['engine'], this, options);
            Service.apply(this, arguments);
            _.bindAll(this, 'doViewRender', 'helper');

            if (this.engine) {
                this.engine.start();
            }
        },

        // Every module using template service receive a new property `helper`.
        //
        // Template listens to 'do:view:render' and 'do:register:helper'
        // commands.
        use: function (module, parent) {

            this.helper({}, module);

            this.listenTo(module, 'do:view:render', this.doViewRender);
            this.listenTo(module, 'do:register:helper', this.helper);

        },

        // clean helpers and stop listening to module.
        dispose: function (module, parent) {

            this.stopListening(module, 'do:view:render', this.doViewRender);
            this.stopListening(module, 'do:register:helper', this.helper);

            // Reset helpers
            module.helper = null;

        },

        // register a helper on obj (or service if none provide).
        // helper will be provided to view rendering on this object.
        //
        // this method accepts key/value arguments or an object.
        helper: utils.keyValueOrObject(function (key, helper, obj) {

            obj || (obj = this);
            obj.helpers || (obj.helpers = {});
            obj.helpers[key] = helper;

            return this;
        }),

        // forward view rendering to engine.
        //
        // this is this service main goal
        doViewRender: function (module, view) {
            var helpers = this.getHelpers(module);
            var globals = this.getExtraData(module, view);

            this.engine.render(view, helpers, globals);
        },

        // Module helpers are merged with service helpers to provide both to
        // engine.
        //
        // Module helpers are stored in it's `helpers` property.
        getHelpers: function (module) {
            return _.extend({}, this.helpers, module.helpers);
        },

        // some data to inject to engine.
        // View and Module are injected so helpers can use it to register
        // events.
        //
        // fossil-views provide cool `attachPlugins` and `detachPlugins` method
        // to attach DOM dependent behaviors.
        getExtraData: function (module, view) {
            return {
                view: view,
                module: module
            };
        }

    });

    return Template;
});
