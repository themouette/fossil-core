define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    "use strict";
    var Folder = Backbone.Collection.extend({
        url: 'data/folders.json'
    });

    return Folder;
});
