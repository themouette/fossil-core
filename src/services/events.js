// services/events is an application wide event dispatcher.
//
// It is bound to modules with app! modifier.
//
// ``` javascript
// var app = new Module();
// var dispatcher = new Events();
// dispatcher.on('foo', function () {});
// app.use('events', dispatcher);
// app.trigger('app!foo');
// ```
define(['underscore', '../service'], function (_, Service) {
    "use strict";

    var Events = Service.extend({
        useDeep: true,
        initialize: function () {
            _.bindAll(this, 'handle');
        },
        use: function (module, parent) {
            module.addEventModifier('app', this.handle, ['on', 'off', 'once', 'trigger']);
        },
        dispose: function (module, parent) {
            module.removeEventModifier('app');
        },

        // forward event to
        handle: function (obj, method, eventname, args) {
            return this[method].apply(this, [eventname].concat(args));
        }
    });

    return Events;

});
