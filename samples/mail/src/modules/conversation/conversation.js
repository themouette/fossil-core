define([
    'underscore', 'fossil/utils', 'fossil/module', './viewStore', '../../collections/conversation'
], function (_, utils, Module, viewStore, Conversations) {
    "use strict";

    var Conversation = Module.extend({
        // the collection to use for the module.
        //
        // this is available as a module option.
        // @param Backbone.Collection
        collection: null,
        // the type of collection to display
        type: null,

        routes: {
            '': 'route:show:list',
            ':id': 'route:show:one'
        },

        events: {
            'start': 'startListener',
            'standby': 'standbyListener',
            'route:show:list': 'list',
            'route:show:one': 'show'
        },

        initialize: function (options) {
            utils.copyOption(['collection', 'type'], this, options);
        },

        startListener: function () {
            this.viewStore = viewStore();
            this.viewStore.decorateModule(this);
        },

        standbyListener: function () {
            this.viewStore.clean();
            this.viewStore.restoreModule(this);
            this.conversations.stopListening();
            this.conversations = null;
        },

        list: function () {
            if (!this.conversations) {
                this.conversations = new Conversations({
                    type: this.type
                });
            }

            this
                .abort()
                .useView('loading')
                .waitForFetchOnce(this.conversations)
                .thenUseView('list', 'error');
        },

        show: function (id) {
            this
                .waitFor(id)
                .thenUseView('show');
        }
    });
    return Conversation;
});

