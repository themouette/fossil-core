define([
    'fossil/module', 'fossil/views/view'
], function (Module, View) {
    "use strict";

    var Compose = Module.extend({
        events: {
            'route:show:compose': 'compose'
        },

        compose: function (id) {
            this.useView('Compose');
        }
    });
    return Compose;
});

