define([
    'fossil/module', './view', '../../models/mail'
], function (Module, View, Mail) {
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
            var view = new View({
                model: new Mail({
                    id: id,
                    to: 'joe@fossil.js',
                    content: ''
                })
            });
            this.useView(view);
        }
    });
    return Compose;
});

