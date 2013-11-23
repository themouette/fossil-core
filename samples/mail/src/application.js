define([
    'underscore',
    'fossil/module', 'fossil/views/regionManager',
    'hbars!templates/layout',
    './modules/compose/compose',
    './modules/conversation/conversation',
    './modules/folder/folder'
], function (_, Module, RegionManager, layoutTpl, ComposeModule, ConversationModule, FolderModule) {
    "use strict";

    var Application = Module.extend({
        events: {
            start: 'startListener',
            // forwarded attach events
            'do:view:attach:folder': 'attachLeft',
            'do:view:attach:conversation': 'attachMain',
            'do:view:attach:compose': 'attachMain',
            // routes
            'route:conversations': 'showConversations'
        },

        routes: {
            '': 'route:conversations'
        },

        initialize: function () {
            this
                .connect('compose', new ComposeModule())
                .connect('conversation', new ConversationModule())
                .connect('folder', new FolderModule());
        },

        startListener: function () {
            this.initCanvas();
            this.forwardModuleAttach();
        },

        initCanvas: function () {
            this.canvas = new RegionManager({
                regions: {
                    'left': 'section[data-fossil-region=left]',
                    'main': 'section[data-fossil-region=main]'
                },
                template: layoutTpl,
                managerRendering: false
            });

            this.useView(this.canvas);

            return this.canvas;
        },

        forwardModuleAttach: function () {
            _.each([
                'folder', 'conversation', 'compose'
            ], function(id) {
                this.modules[id].forward('do:view:attach', 'parent!do:view:attach:'+id);
            }, this);
        },

        attachLeft: function (module, view) {
            this.canvas.registerView(view, 'left');
        },
        attachMain: function (module, view) {
            this.canvas.registerView(view, 'main');
        },

        showConversations: function () {
            this.modules.conversation.trigger('route:show:list');
        }
    });

    return Application;
});
