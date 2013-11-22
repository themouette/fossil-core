define([
    'fossil/views/view', 'fossil/views/collection', 'fossil/views/composite'
], function (View, CollectionView, CompositeView) {
    "use strict";

    var ItemView = View.extend({
        tagName: 'li',
        template: '<%= linkTo(title, id) %>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    var ListView = CollectionView.extend({
        selector: 'ul',
        ItemView: ItemView,
        template: '<ul></lu>'
    });

    var FormView = View.extend({
        tagName: 'p',
        events: {
            'submit form': function (e) {
                e.preventDefault();
                this.collection.add({
                    title: this.$('input').val(),
                    id: this.collection.length
                });
                this.$('input[name="title"]').val('');
            }
        },
        initialize: function (options) {
            this.collection = options.collection;
        },
        template: '<form><input type="text" name="title" /><input type="submit" value="Add" /></form>'
    });

    var MainView = CompositeView.extend({
        initialize: function (options) {
            var list = new ListView({
                collection: options.collection
            });
            var form = new FormView({
                collection: options.collection
            });
            this.registerView(form);
            this.registerView(list);
        },
        template: ''
    });

    return MainView;
});
