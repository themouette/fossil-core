define([
    'fossil/views/view',
    'fossil/views/collection',
    'hbars!./list'
], function (View, CollectionView, listTpl) {
    "use strict";

    var ItemView = View.extend({
        tagName: 'li',
        template: '<a href="#folders/{{name}}">{{label}}</a>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    return CollectionView.extend({
        selectFolder: function (id) {
            this.$('a.selected').removeClass('selected');
            this.$('a[href="#folders/'+id+'"]').addClass('selected');
        },
        ItemView: ItemView,
        template: listTpl,
        selector: 'ul.folders'
    });
});
