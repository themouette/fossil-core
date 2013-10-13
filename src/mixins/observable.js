define([
    'underscore', 'backbone'
], function (_, Backbone) {
    'use strict';

    var exposedPubsubProperties = ['_listenerId', 'createPubSub'].concat(_.keys(Backbone.Events));

    var Observable = _.extend({}, Backbone.Events, {
        initialize: function (options) {
            var events = _.extend(
                {},
                _.result(this, 'events'),
                _.result(options || {}, 'events')
            );
            var observable = this;

            this.events = events;

            _.each(events, function (method, eventid) {
                // create callback from method
                // if it is not a function already, it should be a method
                if (!_.isFunction(method)) {
                    method = observable[method];
                }
                observable.listenTo(observable, eventid, _.bind(method, observable));
            });
        },

        // expose application's PubSub to plug it in application.
        createPubSub: function (observer, property) {
            var pubsub = {}, observable = this;
            _.each(exposedPubsubProperties, function (property) {
                if (_.isFunction(observable[property])) {
                    pubsub[property] = _.bind(observable[property], observable);
                } else {
                    pubsub[property] = observable[property];
                }
            });

            // in case there is no observer
            if (!observer) {return pubsub;}

            var events = _.extend(
                {},
                _.result(observer, property),
                _.result(observer.options || {}, property)
            );

            _.each(events, function (method, eventid) {
                // create callback from method
                // if it is not a function already, it should be a method
                if (!_.isFunction(method)) {
                    method = observer[method];
                }
                observable.listenTo(observable, eventid, _.bind(method, observer));
            });

            return pubsub;
        }
    });

    return Observable;
});
