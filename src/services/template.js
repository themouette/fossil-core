// Template service is a way to both abstract rendering engine and inject
// helpers.
//
// Template service is the priviledged way (and as much as possible should be
// the only way) to render templates. It adds both `module` and `view` as
// template variables.
//
// Template engine listens to modules 'do:view:render' event so it is totally
// transparent to the module.
//
// Every view, once rendered, provides a `refresh` method, to ensure data required
// by helpers are available.
define(['underscore', '../utils', '../service'], function (_, utils, Service) {
    "use strict";

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
            utils.copyOption(['helpers'], module, module.options);
            module.helpers || (module.helpers = {});

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

        // Return a safe string for template engine.
        safe: function (str) {
            if (this.engine.safe) {
                return this.engine.safe(str);
            }

            return str;
        },

        // forward view rendering to engine.
        //
        // this is this service main goal
        doViewRender: function (module, view, helpers, globals) {
            helpers || (helpers = {});
            globals || (globals = {});

            _.extend(helpers, this.getHelpers(module, view));
            _.extend(globals, this.getExtraData(module, view));

            decorateViewRefresh(this, view, _.rest(arguments, 2));

            this.engine.render(view, helpers, globals);
        },

        // Module helpers are merged with service helpers to provide both to
        // engine.
        //
        // Module helpers are stored in it's `helpers` property.
        getHelpers: function (module, view) {
            return _.extend(
                {},
                this.helpers,
                module.helpers,
                view.helpers || {}
            );
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

    function decorateViewRefresh(module, view, args) {
        var refresh;
        // restore undecorated method.
        // This might be decorated with another module or other data.
        if (view.hasOwnProperty('__Fossil_Module_refreshOrig')) {
            module.refresh = view.__Fossil_Module_refreshOrig;
        }
        // keep a reference to undecorate method for further undecoration.
        if (view.hasOwnProperty('refresh')) {
            refresh = module.__Fossil_Module_refreshOrig = view.refresh;
        }
        view.refresh = function decoratedViewRefresh() {
            module.render.apply(module, [module, view].concat(args));
        };
    }

    return Template;
});
