/* global console:false*/
// This is a work in progress, do not expect any of this to be stable.
define([
    '../utils',
    'underscore',
    '../module'
], function (utils, _, Module) {
    "use strict";

    var LazyModule = Module.extend({
        initialize: function (options) {
            this.options = options;
            utils.copyOption('factory', this, options);
        },
        events: {
            'do:connect:to:parent': 'connectListener'
        },
        factory: function (options) {
            console.error('Please provide a factory to LazyModule');
        },

        connectListener: function(parent, childid, child) {
            var extra = _.tail(arguments, 3);
            var lazy = this;
            parent.once('start', function () {
                parent.route(lazy.url+'*parts', _.bind(lazy.loadOnRouteMatch, lazy, parent, childid, extra));
            });
        },

        loadOnRouteMatch: function (parent, id, extra, uri) {
            var child = this.factory(this.options);
            parent.connect.apply(parent, [id, child].concat(extra));

            child.then(function () {
                child.navigate('loading', {trigger: true, replace:true});
                child.navigate(uri, {trigger: true, replace:true});
            });
        }
    });

    return LazyModule;
});
