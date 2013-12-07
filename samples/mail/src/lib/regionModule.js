define([
    'fossil/utils',
    'underscore',
    'fossil/module', 'fossil/views/regionManager'
], function (utils, _, Module, RegionManager) {
    "use strict";

    var RegionModule = Module.extend({
        // option to override layout.
        layout: null,

        // register modules.
        //
        // Copy options and bind methods.
        constructor: function (options) {
            utils.copyOption(['layoutOptions'], this, options);
            this.forwardModuleAttach = utils.keyValueOrObject(this.forwardModuleAttach);
            _.bindAll(this, 'setModuleRegion');
            Module.apply(this, arguments);
        },

        _doStart: function () {
            // create the layout
            this.initLayout();

            // every submodule should refer to this one when it comes to view
            // attachement.
            //
            // See `forwardModuleAttach` documentation to see how this is handled
            this.forwardModuleAttach(this.modules);

            Module.prototype._doStart.apply(this, arguments);
        },

        _doStandby: function () {
            Module.prototype._doStandby.apply(this, arguments);

            // remove layout.
            // It also removes subviews.
            this.removeLayout();

            // release submodules events
            _.each(this.modules, function (mod) {
                mod.stopListening(this);
            }, this);
        },

        ///////////////////////////////////////////////////////////////////////
        //                                                                   //
        //  Layout related                                                   //
        //  --------------                                                   //
        //                                                                   //
        //  Layout offer 2 regions: 'left' and 'main'.                       //
        //  Layout is available under `this.layout`                          //
        //                                                                   //
        //  Methods `setRegion` and `setModuleRegion` are used to set view   //
        //  in regions.                                                      //
        //                                                                   //
        //  Module attach behavior is initialized in `fowawrdModuleAttach`   //
        //  method.                                                          //
        //                                                                   //
        ///////////////////////////////////////////////////////////////////////

        // Override the connect method to copy
        //
        // If main module is started, then an handler is registered on the
        // modules 'do:view:attach' event.
        // Otherwise, this is done on main module start.
        //
        // For now only `region` options is available
        //
        // @param String    id
        // @param Module    module
        // @param Object    options extra options.
        connect: function (id, module, options) {
            utils.copyOption('region', module, options);
            Module.prototype.connect.call(this, id, module);
            if (this.run) {
                this.forwardModuleAttach(id, module);
            }

            return this;
        },

        // extension point for layout options extension.
        //
        // Keep in mind that `managerRendering` should be to false,
        // or helpers may not be forwarded.
        //
        // @params Object   required options for fossil to work.
        // @return Object
        computeLayoutOptions: function (options) {
            return options;
        },

        // Override region manager here.
        createLayout: function (options) {
            return new RegionManager(options);
        },

        // create the mail layout.
        initLayout: function () {
            var layout = _.result(this, 'layout');
            var options;
            if (!layout) {
                options = this.computeLayoutOptions({ managerRendering: false });
                layout = this.createLayout(options);
            }

            this.layout = layout;

            this.useView(this.layout);

            return this;
        },

        // remove the layout.
        removeLayout: function () {
            // actualy remove layout
            this.layout.remove();

            return this;
        },

        // Modules triggers 'do:view:attach' to attach a view.
        //
        // By default nothing happens as nothing listens to this event.
        // An orchestration module handles its children attachement. In our
        // case a region manager is used, but feel free to be inventive.
        //
        // This method listens to children 'do:view:attach' events and
        // handles attachement.
        forwardModuleAttach: function (moduleid, module) {
            // Attach view on region
            this.listenTo(module, 'do:view:attach', this.setModuleRegion);
            // on module attach, handle module selection
            this.listenTo(module, 'do:view:attach', _.bind(this.moduleSelectedListener, this, moduleid));

            return this;
        },

        // replace the view in a region with the new one.
        //
        // @param View      view    the view to attach.
        // @param String    region  the name of region to set.
        // @return Module
        setRegion: function (view, region) {
            this.layout.registerView(view, region);

            return this;
        },
        // Place the view in the default module.region.
        //
        // @param Module    module  the module sending command.
        // @param View      view    the view to attach.
        // @param String    region  the name of region to set.
        // @return Module
        setModuleRegion: function (module, view, region) {
            this.setRegion(view, region || module.region);

            return this;
        },

        // triggers 'do:module:select' on RegionModule when a view is attached
        // to regionManager.
        //
        // @trigger 'do:module:select'                  function (region, moduleid, module, view) {}
        // @trigger 'do:module:select:<%- region %>'    function (moduleid, module, view) {}
        moduleSelectedListener: function (moduleid, module, view, region) {
            region || (region = module.region);

            // a module is attached to main region, so warn main module.
            // trigger a generic event
            module.trigger('parent!do:module:select', region, moduleid, module, view);

            // trigger specialized event
            var eventname = _.template('parent!do:module:select:<%- region %>', {region: region});
            module.trigger(eventname, moduleid, module, view);
        }
    });

    return RegionModule;
});
