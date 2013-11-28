define([
    'fossil/module', 'fossil/views/view'
], function (Module, View) {
    "use strict";

    var Compose = Module.extend({
        routes: {
            '': 'route:show:compose',
            ':id': 'route:show:compose'
        },
        events: {
            'route:show:compose': 'compose'
        },

        compose: function (id) {
            this.useView('Compose');
        }
    });
    return Compose;
});

