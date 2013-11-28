define([
    'hbars!./show',
    'fossil/views/view'
], function (tpl, View) {
    "use strict";

    var ListView = View.extend({
        template: tpl
    });

    return ListView;
});
