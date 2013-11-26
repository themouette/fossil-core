define([
    'fossil/views/view',
    'fossil/views/collection',
    'hbars!./list'
], function (View, CollectionView, listTpl) {
    "use strict";

    var ItemView = View.extend({
        tagName: 'li',
        template: '<a href="{{id}}">{{label}}</a>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    return CollectionView.extend({
        ItemView: ItemView,
        template: listTpl,
        selector: 'ul.folders'
    });
});
