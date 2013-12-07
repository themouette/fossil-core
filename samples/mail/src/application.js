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
            // route events
            // ------------
            //
            // This is a best practice to use events for
            // as controllers, this becomes the public api
            // when module is reused inside another application.
            'route:index': 'index',
            'route:listfolder': 'showFolder',
            'route:showfolderitem': 'showFolderItem',
            // whenever a module is attached to main area,
            // it triggers this event.
            // This is used to update other modules state.
            'do:module:select:main': 'selectFolder'
        },

        routes: {
            // default handler.
            // This is the first registered route, so it matches last.
            '*route': 'page404',
            // routes maps to event by default when there is no matching
            // method.
            '': 'route:index',
            'inbox*parts': 'showInbox',
            'drafts': 'showDrafts',
            'drafts/:id': 'showDraftsItem',
            'trash': 'showTrash',
            'trash/:id': 'showTrashItem',
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
                // .connectInbox(options.inbox)
                // .connectDrafts(options.drafts)
                // .connectTrash(options.trash)
                ;
        },

        // create the compose module if not provided
        connectCompose: function (composeOption) {
            var module = this.modules.compose;

            if (!module) {
                module = composeOption || compose;
                this.connect('compose', module, {region: 'main'});
            }

            return module;
        },

        // create the conversation module if not provided
        connectInbox: function (conversationOption) {
            var module = this.modules.inbox;

            if (!module) {
                module = conversationOption || conversation;
                this.connect('inbox', module, {region: 'main'});
            }

            return module;
        },

        // create the drafts module if not provided
        connectDrafts: function (draftOption) {
            var module = this.modules.drafts;

            if (!module) {
                module = draftOption || draft;
                this.connect('drafts', module, {region: 'main'});
            }

            return module;
        },

        // create the trash module if not provided
        connectTrash: function (trashOption) {
            var module = this.modules.trash;

            if (!module) {
                module = trashOption || trash;
                this.connect('trash', module, {region: 'main'});
            }

            return module;
        },

        // create the folder module if not provided
        connectFolderList: function (folderOption) {
            var module = this.modules.folder;

            if (!module) {
                module = folderOption || folder;
                this.connect('folder', module, {region: 'main'});
                // trigger command for the folder to render on left region.
                // the param is given as the target region.
                //
                // see Folder module to learn more.
                module.thenTrigger('route:show', null, null, 'left');
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

        // bound on 'do:module:select:main'.
        //
        // Whenever a module is happened to main panel,
        // select according item in menu.
        //
        // Folders are initialized, then it receives a change of state command.
        selectFolder: function (moduleid, module) {
            var sidebar = this.connectFolderList();

            sidebar.thenTrigger('do:select:folder', null, null, moduleid);
        },

        index: function () {
            this.navigate('inbox', {trigger: true, replace: true});
        },

        page404: function (route) {
            this.setRegion(new View({template:'404'}), 'main');
        },


        // Load inbox module.
        //
        // inbox module urls will overload this one.
        // This is only for connecting module the first time.
        showInbox: function (part) {
            var inbox = this.connectInbox();

            // A url change is required to have the forward change.
            inbox.navigate('loading', {trigger: true, replace:true});

            inbox.then(function () {
                inbox.navigate(part || '', {trigger: true, replace:true});
            });
        },


        showDrafts: function () {
            var drafts = this.connectDrafts();

            drafts.thenTrigger('route:show:list');
        },

        showDraftsItem: function (id) {
            var drafts = this.connectDrafts();

            drafts.thenTrigger('route:show:one', null, null, id);
        },


        showTrash: function () {
            var trash = this.connectTrash();

            trash.thenTrigger('route:show:list');
        },

        showTrashItem: function (id) {
            var trash = this.connectTrash();

            trash.thenTrigger('route:show:one', null, null, id);
        },


        showFolder: function (id) {
            var folder = this.connectFolder(id);

            folder.thenTrigger('route:show:list');
        },

        showFolderItem: function (id, conversationid) {
            var folder = this.connectFolder(id);

            folder.thenTrigger('route:show:one', null, null, conversationid);
        }
    });

    return Application;
});
