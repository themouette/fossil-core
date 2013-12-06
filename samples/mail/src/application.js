define([
    'fossil/utils',
    'underscore',
    './lib/regionModule', 'fossil/views/view', 'fossil/views/regionManager',
    'hbars!templates/layout',
    'module.compose',
    'module.conversation',
    'module.draft',
    'module.trash',
    'module.folder',
    './modules/conversation/conversation'
], function (utils, _, RegionModule, View, RegionManager, layoutTpl, compose, conversation, draft, trash, folder, Conversation) {
    "use strict";

    var Application = RegionModule.extend({
        events: {
            'start': 'startListener',
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
        initialize: function (options) {
            options || (options = {});
            this
                .connectCompose(options.compose)
                .connectInbox(options.inbox)
                .connectDrafts(options.drafts)
                .connectTrash(options.trash);
        },

        // create the compose module if not provided
        connectCompose: function (composeOption) {
            return this
                .connect('compose', composeOption || compose, {region: 'main'});
        },

        // create the conversation module if not provided
        connectInbox: function (conversationOption) {
            return this
                .connect('inbox', conversationOption || conversation, {region: 'main'});
        },

        // create the drafts module if not provided
        connectDrafts: function (draftOption) {
            return this
                .connect('drafts', draftOption || draft, {region: 'main'});
        },

        // create the trash module if not provided
        connectTrash: function (trashOption) {
            return this
                .connect('trash', trashOption || trash, {region: 'main'});
        },

        // create the folder module if not provided
        connectFolderList: function (folderOption) {
            var module = this.modules.folder;

            if (!module) {
                module = folderOption || folder;
                this.connect('folder', module, {region: 'main'});
            }

            return module;
        },

        // create the folder module if not provided
        connectFolder: function (folderid) {
            var folder = 'folders/'+folderid;
            var module = this.modules[folder];

            if (!module) {
                module = new Conversation({
                    type: folderid,
                    startWithParent: true
                });
                this.connect(folder, module, {region: 'main'});
            }

            return module;
        },

        // load folders
        // ------------
        //
        // trigger command for the folder to render on left region.
        // the param is given as the target region.
        //
        // see Folder module to learn more.
        startListener: function () {
            this.connectFolderList();
            var folder = this.modules.folder;
            folder.trigger('route:show', 'left');
        },

        // Options for the main layout.
        //
        // A basic RegionManager is used.
        computeLayoutOptions: function (options) {

            return _.extend(options, {
                regions: {
                    'left': 'section[data-fossil-region=left]',
                    'main': 'section[data-fossil-region=main]'
                },
                template: layoutTpl
            });
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
            this.setRegion(new View({template:'404'}), 'main');
        },

        showFolder: function (id) {
            var module = this.connectFolder(id);
            var sidebar = this.connectFolderList(id);

            module.thenTrigger('route:show:list');
            sidebar.thenTrigger('select:folder', null, null, id);
        },

        showFolderItem: function (id, conversationid) {
            var folder = this.connectFolder(id);
            var sidebar = this.connectFolderList(id);

            folder.thenTrigger('route:show:one', null, null, conversationid);
            sidebar.thenTrigger('select:folder', null, null, id);
        }
    });

    return Application;
});
