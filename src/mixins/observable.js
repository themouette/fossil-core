define([
    'underscore', 'backbone'
], function (_, Backbone) {
    'use strict';

    var exposedPubsubProperties = ['_listenerId', 'createPubSub'].concat(_.keys(Backbone.Events));

    var Observable = _.extend({}, Backbone.Events, {
        // an array of event modifiers.
        //
        // event modifiers are a way to alter event methods behavior.
        //
        // If eventname matches the modifier, then the associated callback will
        // be called instead of native method.
        //
        // @type Array
        eventModifiers: null,

        initialize: function (options) {
            this.eventModifiers = [];
            var events = _.extend(
                {},
                _.result(this, 'events'),
                _.result(options || {}, 'events')
            );
            var observable = this;

            // register event modifiers
            this.initializeEventModifiers(options);

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

        initializeEventModifiers: function (options) {
            this.addEventModifier('one', oneEvent, ['trigger']);
            this.addEventModifier('map', mapEvent, ['trigger']);
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
        },

        // forwad an event to another one
        //
        // Any `src` event will trigger `dest` event as well.
        //
        // ``` javascript
        // obj.on('bar', function (message) {
        //     // do somethig amazing on bar
        // });
        //
        // obj.forward('foo', 'bar');
        //
        // // will trigger bar listener
        // obj.trigger('foo', 'arguments are forwarded too');
        // ```
        forward: function (src, dest) {
            this.on(src, forward(this, dest));

            return this;
        },

        // add an event modifier.
        //
        // @argument RegExp|String  matcher the event matcher.
        // @argument function       hook    the hook to use.
        // @argument Array|String   methods methods to listen to (default: 'all').
        //
        // @return Observable
        addEventModifier: function (matcher, hook, methods) {
            methods || (methods = 'all');
            if (!(matcher instanceof RegExp)) {
                matcher = ensureRegexp(matcher);
            }
            this.eventModifiers.push({
                matcher: matcher,
                action: hook,
                methods: methods
            });

            return this;
        },

        // remove all event modifiers by key.
        //
        // @argument String|RegExp  matcher the matcher to remove.
        //
        // @return Observable
        removeEventModifier: function (matcher) {
            if (!(matcher instanceof RegExp)) {
                matcher = ensureRegexp(matcher);
            }

            this.eventModifiers = _.reduce(this.eventModifiers, function (accumulator, modifier) {
                if (modifier.matcher.toString() !== matcher.toString()) {
                    accumulator.push(modifier);
                }

                return accumulator;
            }, []);

            return this;
        }
    });

    _.each(['on', 'off', 'once', 'trigger', 'listenTo', 'listenToOnce', 'stopListening'], function (method) {
        Observable[method] = function wrapEventMethod(eventname) {
            var extra = _.rest(arguments);
            var ret;

            var matched = _.any(this.eventModifiers, function (modifier) {
                // not applicable to method
                if (modifier.methods !== "all" && -1 === modifier.methods.indexOf(method)) {
                    return false;
                }

                if (modifier.matcher.test(eventname)) {
                    eventname = eventname.match(modifier.matcher)[1];
                    ret = modifier.action(this, method, eventname, extra);

                    return true;
                }

                return false;
            }, this);

            if (matched) {
                return ret;
            }

            Backbone.Events[method].apply(this, arguments);

            return this;
        };
    });

    var forward = function (observable, eventname) {
        return function (original) {
            var args = _.toArray(arguments);
            observable.trigger.apply(observable, [eventname].concat(args));
        };
    };

    function ensureRegexp(str) {
        return new RegExp('^'+str+'!(.*)$', 'i');
    }

    // return the first listener result.
    function oneEvent(obj, method, event, extra) {
        var listener = obj._events && obj._events[event] ? _.first(obj._events[event]) : null;
        if (listener) {
            return listener.callback.apply(listener.context || obj, extra);
        }
        return null;
    }
    // return a map of all listeners return value.
    function mapEvent(obj, method, event, extra) {
        if (!obj._events) {
            return [];
        }
        return _.map(obj._events[event], function (listener) {
            return listener.callback.apply(listener.context || obj, extra);
        }, obj);
    }

    return Observable;
});
