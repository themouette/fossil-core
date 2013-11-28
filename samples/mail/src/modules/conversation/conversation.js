define([
    'fossil/utils', 'fossil/module', './viewStore', '../../collections/conversation'
], function (utils, Module, viewStore, Conversations) {
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
        },

        standbyListener: function () {
            this.viewStore.clean();
            this.conversations.stopListening();
            this.conversations = null;
        },

        prepareConversations: function () {
            if (!this.conversations) {
                this.conversations = new Conversations({
                    type: this.type
                });
            }

            if (!this.conversations.loaded) {

                this
                    .abort()
                    .useView('loading')
                    .waitFor(this.conversations.fetch());

                this.conversations.loaded = true;
            }

            return this;
        },

        list: function () {
            this
                .prepareConversations()
                .thenWith(this, function () {
                    this.useView('list', this.conversations);
                })
                .thenUseView(null, 'error');
        },

        show: function (id) {
            this.waitFor(id);
            this.useView('Show {{id}}');
        },

        // retrive or instanciat a view from store
        useView: function (name, options) {
            if (this.viewStore.has(name)) {
                return Module.prototype.useView.call(this, this.viewStore.get.apply(this.viewStore, arguments));
            }
            return Module.prototype.useView.apply(this, arguments);
        }
    });
    return Conversation;
});

