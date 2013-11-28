define([
    'fossil/utils',
    'underscore',
    'fossil/module', 'fossil/views/view', 'fossil/views/regionManager',
    'hbars!templates/layout',
    'module.compose',
    'module.conversation',
    'module.draft',
    'module.trash',
    'module.folder',
    './modules/conversation/conversation'
], function (utils, _, Module, View, RegionManager, layoutTpl, compose, conversation, draft, trash, folder, Conversation) {
    "use strict";

    var Application = Module.extend({
        events: {
            'start': 'startListener',
            'standby': 'standbyListener',
            // route events
            // ------------
            //
            // This is a best practice to use events for
            // as controllers, this becomes the public api
            // when module is reused inside another application.
            'route:index': 'index',
            'route:listfolder': 'showFolder',
            'route:showfolderitem': 'showFolderItem'
        },

        routes: {
            // default handler.
            // This is the first registered route, so it matches last.
            '*route': 'page404',
            // routes maps to event by default when there is no matching
            // method.
            '': 'route:index',
            'folders/:id': 'route:listfolder',
            'folders/:folder/:id': 'route:showfolderitem'
        },

        // register modules.
        //
        // By default, the module id is used as routing path, so all the module
        // routes are automaticly registered (unles the routing service is not
        // configured with useDeep.
        //
        // Module connection has been extended to leverage the region option.
        initialize: function () {
            _.bindAll(this, 'setModuleRegion');

            this
                .connect('compose', compose, {region: 'main'})
                .connect('inbox', conversation, {region: 'main'})
                .connect('drafts', draft, {region: 'main'})
                .connect('trash', trash, {region: 'main'})
                .connect('folder', folder, {region: 'left'});
        },

        startListener: function () {
            // every submodule should refer to this one when it comes to view
            // attachement.
            //
            // See `forwardModuleAttach` documentation to see how this is handled
            _.each(this.modules, function (mod) {
                this.forwardModuleAttach(mod);
            }, this);
            this
                // create the layout
                .initLayout()
                // and load folders
                .loadFolders();
        },

        standbyListener: function () {
            // remove layout.
            // It also removes subviews.
            this.layout.remove();
            // release submodules events
            _.each(this.modules, function (mod) {
                mod.stopListening(this);
            }, this);
        },

        // trigger command for the folder to render on left region.
        // the param is given as the target region.
        //
        // see Folder module to learn more.
        loadFolders: function () {
            folder.trigger('route:show', 'left');

            return this;
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
                this.forwardModuleAttach(module);
            }

            return this;
        },

        // create the mail layout.
        initLayout: function () {
            this.layout = new RegionManager({
                regions: {
                    'left': 'section[data-fossil-region=left]',
                    'main': 'section[data-fossil-region=main]'
                },
                template: layoutTpl,
                managerRendering: false
            });

            this.useView(this.layout);

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
        //
        // An other way to do that would be to forward events:
        //
        // ```
        // // forwarded attach events
        // events: {
        //     'do:view:attach:region': 'setModuleRegion'
        // },
        //
        // forwardModuleAttach: function (module) {
        //     module.forward('do:view:attach', 'parent!do:view:attach:region');
        // }
        // ```
        forwardModuleAttach: function (module) {
            this.listenTo(module, 'do:view:attach', this.setModuleRegion);

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

        ///////////////////////////////////////////////////////////////////////
        //                                                                   //
        //  Controllers                                                      //
        //  -----------                                                      //
        //                                                                   //
        //  This part is all about orchestrating top level routes.           //
        //                                                                   //
        //  * index: the main route, forward to inbox.                       //
        //  * page404: when no route matches                                 //
        //  * showFolder: create a new folder module if not already and      //
        //    show list.                                                     //
        //  * showFolderItem: create a new folder module if not already and  //
        //    show item.                                                     //
        //                                                                   //
        ///////////////////////////////////////////////////////////////////////

        index: function () {
            this.navigate('inbox', {trigger: true, replace: false});
        },

        page404: function (route) {
            this.attachMain(this, new View({template:'404'}));
        },

        showFolder: function (id) {
            var folder = 'folders/'+id;
            if (!this.modules[folder]) {
                this.connect(folder, new Conversation({
                    type: id,
                    startWithParent: false
                }), {region: 'main'});
                this.listenTo(this.modules[folder], 'do:view:attach', this.attachMain);
                this.modules[folder].start();
            }

            this.modules[folder].thenWith(this, function () {
                this.modules[folder].trigger('route:show:list');
            });
        },

        showFolderItem: function (id, conversationid) {
            var folder = 'folders/'+id;
            if (!this.modules[folder]) {
                this.connect(folder, new Conversation({
                    type: id,
                    startWithParent: false
                }), {region: 'main'});
                this.listenTo(this.modules[folder], 'do:view:attach', this.attachMain);
                this.modules[folder].start();
            }

            this.modules[folder].thenWith(this, function () {
                this.trigger('route:show:one', conversationid);
            });
        }
    });

    return Application;
});
