define([
    'hbars!./list',
    'fossil/views/view'
], function (tpl, View) {
    "use strict";

    var ListView = View.extend({
        template: tpl,
        getViewData: function () {
            return {
                type: this.collection.type
            };
        }
    });

    return ListView;
});
