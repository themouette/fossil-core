define([ 'fossil/views/collection', 'fossil/views/collection' ], function (View, CollectionView) {

    var ItemView = View.extend({
        tagName: 'li',
        template: '<a href="#<%= id %>"><%= title %></a>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    var ListView = CollectionView.extend({
        selector: 'ul',
        ItemView: ItemView,
        template: '<ul></lu>'
    });

    return ListView;
});
