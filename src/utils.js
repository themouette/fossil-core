define(['underscore'], function (_) {
    "use strict";

    var messages = {
        invalid_src: 'Invalid source object.'
    };

    function scalarOrArray(method) {
        return function () {
            var extra = _.rest(arguments);
            var arg = _.first(arguments);
            if (_.isArray(arg)) {
                return _.map(arg, function (arg) {
                    return method.apply(this, [arg].concat(extra));
                });
            }
            return method.apply(this, arguments);
        };
    }

    function keyValueOrObject(method) {
        return function (key, value) {
            var extra;
            if (typeof(key) !== "string") {
                extra = _.rest(arguments, 1);
                return _.map(key, function (value, key) {
                    return method.apply(this, [key, value].concat(extra));
                });
            }
            extra = _.rest(arguments, 2);
            return method.apply(this, arguments);
        };
    }

    return {
        // if first argument is an Array, then `method` will be mapped
        // on every item.
        //
        // Note that extra parameters will be preserved.
        //
        // ``` js
        // function doSomething(value) {/* ... */};
        // var doBetter = utils.scalarOrArray(doSomething);
        //
        // doBetter(['a', 'b'], extra); // calls `doSomething('a', extra)` and
        //                              // then `doSomething('b', extra)`
        // doBetter('a', extra);        // calls `doSomething('a', extra)`
        // ```
        scalarOrArray: scalarOrArray,
        // add the ability to a function to accept object instead of
        // `key`, `value` arguments.
        // Original funciton will be called as many time as the object length.
        //
        // Note that extra parameters will be preserved.
        //
        // ``` js
        // function doSomething(key, value) {/* ... */};
        // var doBetter = utils.keyValueOrObject(doSomething);
        //
        // doBetter({a:'foo', b: 'bar'}, extra); // calls `doSomething('a', 'foo', extra)` and
        //                                       // then `doSomething('b', 'bar', extra)`
        // doBetter('a', 'foo', extra);          // calls `doSomething('a', 'foo', extra)`
        // ```
        keyValueOrObject: keyValueOrObject,
        // copy `key` property from `options` to `ctx` if
        // it is defined.
        //
        // it is usefull on object initialization.
        //
        // ``` js
        // Backbone.Model.extend({
        //     someProperty: 'defaultValue',
        //     initialize: function (options) {
        //         utils.copyOption('someProperty', this, options);
        //     }
        // });
        // ```
        //
        // This method is already decorated with `scalarOrArray`, that makes
        // it possible to call directly with an array of arguments:
        //
        // ``` js
        // Backbone.Model.extend({
        //     someProperty: 'defaultValue',
        //     other: 'default',
        //     initialize: function (options) {
        //         utils.copyOption(['someProperty', 'other'], this, options);
        //     }
        // });
        // ```
        copyOption: scalarOrArray(function (key, to, from) {
            if (from && typeof(from[key]) !== "undefined") {
                to[key] = from[key];
            }
        }),
        // deeply read a property.
        //
        // ``` js
        // var o = {a: {b: {c: 'foo'}}};
        // utils.getProperty('a.b.c', o);             // returns 'foo'
        // utils.getProperty('a.b.d', o, 'default');  // returns 'default' as `b` has no `d` property.
        // ```
        //
        // This method is already decorated with `scalarOrArray`, that makes
        // it possible to call directly with an array of arguments:
        //
        // ``` js
        // var o = {a: {b: {c: 'foo'}}};
        // utils.getProperty(['a.b.c', 'a.b.d'], o, 'default'); // returns ['foo', 'default']
        // ```
        getProperty: scalarOrArray(function (key, from, alt) {
            var keys = key.split('.');
            var result = _.reduce(keys, function (accumulator, property) {
                if (accumulator && property in accumulator) {
                    return accumulator[property];
                }

                return ;
            }, from);

            return typeof(result) !== "undefined"
                ? result
                : alt;
        }),
        // deeply set a property.
        //
        // In case task is impossible, then an error is thrown.
        //
        // ``` js
        // var o = {a: {b: {c: 'foo'}}};
        // utils.setProperty('a.b.c', 'bar', o);
        // utils.setProperty('d.e.f', 'baz', o);
        // ```
        //
        // This method is already decorated with `keyValueOrObject`, that makes
        // it possible to call directly with an object:
        //
        // ``` js
        // var o = {a: {b: {c: 'foo'}}};
        // utils.setProperty({
        //     'a.b.c': 'bar',
        //     'd.e.f', 'baz'
        // }, o);
        // ```
        setProperty: keyValueOrObject(function (key, value, to) {
            var keys = key.split('.');
            var prop = keys.pop();
            var result = _.reduce(keys, function (accumulator, property) {
                if (!accumulator instanceof Object) {
                    throw new Error(messages.invalid_src);
                }
                if (property in accumulator) {
                    return accumulator[property];
                }
                // create the property as an object
                accumulator[property] = {};

                return accumulator[property];
            }, to);

            if (prop) {
                result[prop] = value;
            }
        })
    };
});
