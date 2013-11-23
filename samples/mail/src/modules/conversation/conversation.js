define([
    'fossil/module', 'fossil/views/view'
], function (Module, View) {
    "use strict";

    var Conversation = Module.extend({
        events: {
            'route:show:list': 'list'
        },

        list: function () {
            this.useView('List');
        }
    });
    return Conversation;
});

