define([
    'underscore',
    'fossil/module', 'fossil/views/view', 'fossil/views/regionManager',
    'hbars!templates/layout',
    'module.compose',
    'module.conversation',
    'module.folder',
    'collections/folder'
], function (_, Module, View, RegionManager, layoutTpl, compose, conversation, folder, FolderCollection) {
    "use strict";

    var Application = Module.extend({
        events: {
            'start': 'startListener',
            // routes
            'route:conversations': 'showConversations',
            'route:drafts': 'showDrafts',
            'route:showoneconversation': 'showOneConversation',
            'route:compose': 'showCompose'
        },

        routes: {
            '': 'route:conversations',
            'inbox': 'route:conversations',
            'inbox/:id': 'route:showoneconversation',
            'draft': 'route:drafts',
            'draft/:id': 'route:compose',
            'compose': 'route:compose'
        },

        initialize: function () {
            _.bindAll(this, 'attachMain', 'attachLeft');

            this
                .connect('compose', compose)
                .connect('conversation', conversation)
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
            this.listenTo(compose, 'do:view:attach', this.attachMain);
        },

        loadFolders: function () {
            var folders = new FolderCollection();
            this
                .waitFor(folders.fetch())
                .thenWith(this, function () {
                    folder.trigger('route:show', folders);
                }, this.showError);
        },

        attachLeft: function (module, view) {
            this.layout.registerView(view, 'left');
        },
        attachMain: function (module, view) {
            this.layout.registerView(view, 'main');
        },

        showConversations: function () {
            conversation.trigger('route:show:list');
        },

        showDrafts: function () {
            conversation.trigger('route:show:list');
        },

        showOneConversation: function (id) {
            conversation.trigger('route:show:one', id);
        },

        showCompose: function (id) {
            compose.trigger('route:show:compose', id);
        },

        showError: function () {
            this.attachLeft(this, new View({
                template: 'Une erreur est survenue'
            }));
        }
    });

    return Application;
});
