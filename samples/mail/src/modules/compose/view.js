define([
    'hbars!./compose',
    'underscore',
    'fossil/views/view'
], function (tpl, _, View) {
    "use strict";

    var Compose = View.extend({
        template: tpl,
        attachPlugins: function () {
        },
        detachPlugins: function () {
        },
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    return Compose;
});
