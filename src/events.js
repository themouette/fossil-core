define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {

    var Events = Fossil.Events = _.extend({}, Backbone.Events, {
        registerEvents: function () {
            var events = _.extend(
                {},
                _.result(this, 'events'),
                _.result(this.options || {}, 'events')
            );
            var observable = this;

            _.each(events, function (method, eventid) {
                // create callback from method
                // if it is not a function already, it should be a method
                if (!_.isFunction(method)) {
                    method = observable[method];
                }
                observable.listenTo(observable, eventid, method, observable);
            });
        }
    });

    return Events;
});
