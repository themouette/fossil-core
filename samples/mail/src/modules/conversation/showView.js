define([
    'hbars!./show',
    'fossil/views/view'
], function (tpl, View) {
    "use strict";

    var ListView = View.extend({
        template: tpl,
        getViewData: function () {
            return {id: this.model};
        }
    });

    return ListView;
});
