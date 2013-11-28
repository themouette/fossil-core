define([
    'fossil/utils',
    'underscore',
    'backbone'
], function (utils, _, Backbone) {
    "use strict";

    var Conversation = Backbone.Collection.extend({
        type: 'inbox',
        url: function () {
            return _.template('data/<%- type %>.json', this);
        },
        initialize: function (options) {
            utils.copyOption('type', this, options);
        }
    });

    return Conversation;
});
