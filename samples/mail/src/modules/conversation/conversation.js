define([
    'fossil/module', 'fossil/views/view'
], function (Module, View) {
    "use strict";

    var Conversation = Module.extend({
        events: {
            'route:show:list': 'list',
            'route:show:one': 'show'
        },

        list: function () {
            this.useView('List');
        },

        show: function (id) {
            this.waitFor(id);
            this.useView('Show {{id}}');
        }
    });
    return Conversation;
});

