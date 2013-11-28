define([
    'underscore',
    'fossil/module', 'fossil/views/view', 'fossil/views/regionManager',
    'hbars!templates/layout',
    'module.compose',
    'module.conversation',
    'module.draft',
    'module.trash',
    'module.folder',
    './modules/conversation/conversation'
], function (_, Module, View, RegionManager, layoutTpl, compose, conversation, draft, trash, folder, Conversation) {
    "use strict";

    var Application = Module.extend({
        events: {
            'start': 'startListener',
            // routes
            'route:conversations': 'showConversations',
            'route:drafts': 'showDrafts',
            'route:trash': 'showTrash',
            'route:showoneconversation': 'showOneConversation',
            'route:compose': 'showCompose',
            'route:listfolder': 'showFolder',
            'route:showfolderitem': 'showFolderItem'
        },

        routes: {
            //'*route': function (route) {this.attachMain(this, new View({template:'404'}));},
            '': 'route:conversations',
            'inbox': 'route:conversations',
            'inbox/:id': 'route:showoneconversation',
            'drafts': 'route:drafts',
            'drafts/:id': 'route:compose',
            'trash': 'route:trash',
            'compose': 'route:compose',
            'folders/:id': 'route:listfolder',
            'folders/:folder/:id': 'route:showfolderitem'
        },

        initialize: function () {
            _.bindAll(this, 'attachMain', 'attachLeft');

            this
                .connect('compose', compose)
                .connect('inbox', conversation)
                .connect('draft', draft)
                .connect('trash', trash)
                .connect('folder', folder);
        },

        startListener: function () {
            this.initLayout();
            this.forwardModuleAttach();
            this.loadFolders();
        },

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

            return this.layout;
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
        //     'do:view:attach:folder': 'attachLeft',
        //     'do:view:attach:conversation': 'attachMain',
        //     'do:view:attach:compose': 'attachMain'
        // },
        //
        // handleModuleAttach: function () {
        //     folder.forward('do:view:attach', 'parent!do:view:attach:folder');
        //     conversation.forward('do:view:attach', 'parent!do:view:attach:conversation');
        //     compose.forward('do:view:attach', 'parent!do:view:attach:compose');
        // }
        // ```
        forwardModuleAttach: function () {
            this.listenTo(folder, 'do:view:attach', this.attachLeft);
            this.listenTo(conversation, 'do:view:attach', this.attachMain);
            this.listenTo(draft, 'do:view:attach', this.attachMain);
            this.listenTo(trash, 'do:view:attach', this.attachMain);
            this.listenTo(compose, 'do:view:attach', this.attachMain);
        },

        loadFolders: function () {
            folder.trigger('route:show', 'left');
        },

        attachLeft: function (module, view, region) {
            this.layout.registerView(view, region || 'left');
        },
        attachMain: function (module, view) {
            this.layout.registerView(view, 'main');
        },

        showConversations: function () {
            conversation.trigger('route:show:list');
        },

        showDrafts: function () {
            draft.trigger('route:show:list');
        },

        showTrash: function () {
            trash.trigger('route:show:list');
        },

        showOneConversation: function (id) {
            conversation.trigger('route:show:one', id);
        },

        showCompose: function (id) {
            compose.trigger('route:show:compose', id);
        },

        showFolder: function (id) {
            var folder = 'folders/'+id;
            if (!this.modules[folder]) {
                this.connect(folder, new Conversation({
                    type: id,
                    startWithParent: false
                }));
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
                }));
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
