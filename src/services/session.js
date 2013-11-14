// Fossil.Services.Session helps in sharing data between module.
define([
    'underscore', 'backbone', '../utils', '../service'
], function (_, Backbone, utils, Service) {
    'use strict';

    // methods of model to expose directly in the service instance.
    var expose = ['get', 'set', 'has', 'save'];

    var Session = Service.extend({
        // model to use to store session
        model: null,

        constructor: function (options) {
            utils.copyOption(['defaults', 'model'], this, options);

            Service.apply(this);

            this.model || (this.model = new Backbone.Model(this.defaults || {}));
            var service = this;
            var m = this.model;
            _.each(expose, function (method) {
                service[method] = _.bind(m[method], m);
            });
        },

        use: function(module, parent) {
            this.listenTo(module, 'do:set:session', this.set);
            this.listenTo(module, 'do:get:session', this.get);
            this.listenTo(module, 'do:save:session', this.save);
            this.listenTo(module, 'do:has:session', this.has);
        },
        dispose: function(module, parent) {
            this.stopListening(module, 'do:store:session', this.set);
            this.stopListening(module, 'do:get:session', this.get);
            this.stopListening(module, 'do:save:session', this.save);
            this.stopListening(module, 'do:has:session', this.has);
        }
    });

    return Session;
});
