define([
    'fossil/viewStore',
    'fossil/views/view',
    './listView',
    './showView'
], function (Store, View, ListView, ShowView) {
    "use strict";

    return function () {
        var store = new Store();

        store.set('error', function () {
            return new View({
                template: '<p>An error happened</p>'
            });
        });

        store.set('list', function(conversations) {
            return new ListView({
                recycle: true,
                collection: conversations
            });
        });

        store.set('show', function (draft) {
            return new ShowView({
                model: draft
            });
        });

        return store;
    };
});
