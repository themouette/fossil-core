define([
    'underscore',
    'fossil/views/view',
    'fossil/views/collection',
    'hbars!./list'
], function (_, View, CollectionView, listTpl) {
    "use strict";

    var ItemView = View.extend({
        tagName: 'li',
        template: '<a href="#folders/{{name}}">{{label}}</a>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    return CollectionView.extend({
        ItemView: ItemView,
        template: listTpl,
        selector: 'ul.folders',
        iniitialize: function (options) {
            _.bindAll(this, 'onSelectModuleChange');
        },
        attachPlugins: function () {
            if (this.model.has('selected')) {
                this.selectFolder(this.model.get('selected'));
            }
            this.listenTo(this.model, 'change:selected', this.onSelectModuleChange);
        },
        detachPlugins: function () {
            this.stopListening(this.model);
        },
        selectFolder: function (uri) {
            this.$('li.is-selected').removeClass('is-selected');
            this.$('a[href="#'+uri+'"]').parent().addClass('is-selected');
        },
        onSelectModuleChange: function (model, uri) {
            this.selectFolder(uri);
        }
    });
});
