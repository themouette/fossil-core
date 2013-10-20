// Fossil is based on `Mixin`, an extendable base classe able to register
// mixins.
//
// ## Extend
//
// `extend` method is used to create a new class, inheriting the parent class.
//
// ``` javascript
// var My = Mixin.extend({
//     method: function () {};
// });
//
// My.mix(Observable);
//
// var my = new My();
// console.log(my instanceof Mixin);
// ```
//
// You can replace constructor by providing a `constructor` method. If you do
// so, it you can call parent constructor as follow:
//
// ``` javascript
// var My = Mixin.extend({
//
//     constructor: function () {
//         // call Mixin constructor
//         Mixin.apply(this, arguments);
//         // Add an optional initialize hook
//         if (this.initialize) {
//             this.initialize.apply(this, arguments);
//         }
//     };
//
// });
// ```
//
// ## mix
//
// Javascript development is often a matter of mixing several pieces of code
// into one class. Those reusable pieces of code are called mixins, or
// eventually traits in some other languages.
//
// Fossil `Mixin` class provides a `mix` method to register mixins.
// Registered mixins can hook into object extension points.
//
// ``` javascript
// var MyMixin = {
//     foo: function () {
//         return 'bar';
//     }
// };
// var My = Mixin.extend({});
// My.mix(MyMixin);
//
// var my = new My();
// my.foo(); // returns 'bar'
// ```
//
// Special mixin method `initialize`
define(['underscore', './utils'], function (_, utils) {
    "use strict";

    // declare a list of mixin special keys not to copy into object on
    // extension.
    //
    // Calling `Obj.mix()` will not copy any of those methods.
    var specials = ['initialize'];

    // check wether given key is a special mixin key
    function isSpecialFunction(name) {
        return (-1 !== specials.indexOf(name));
    }

    // Copy mixin methods into original class.
    //
    // Any existing key will not be overriden.
    function delegateMixin(self, mixin) {
        _.each(mixin, function (method, name) {
            if (!self[name] && !isSpecialFunction(name)) {
                self[name] = method;
            }
        });
    }

    // Remove every mixin function.
    //
    // Any object property not matching the mixin original funciton will not be
    // removed, so be careful when wrapping mixin methods.
    function undelegateMixin(self, mixin) {
        _.each(mixin, function (method, name) {
            if (!isSpecialFunction(name) && method === self[name]) {
                delete self[name];
            }
        });
    }

    // define the Mixin constructor.
    function Mixin() {
        var self = this;
        var args = arguments;

        // call every mixin `initialize` method with constructor arguments
        _.each(this.mixins, function (mixin) {
            if (typeof(mixin.initialize) === "function") {
                mixin.initialize.apply(self, args);
            }
        });
    }

    // An array to store mixins.
    //
    // This belongs to the Mixin protype so constructor is able to iterate over
    // available mixins.
    Mixin.prototype.mixins = [];

    _.extend(Mixin, {
        // Register a mixin on the object.
        //
        // All methods are copied into the object prototype directly.
        //
        // Accepts an array of mixins as it is wrapped with
        // `utils.scalarOrArray`.
        //
        // @param Array|Object  mixin   mixin to register
        //
        // @return Mixin
        mix: utils.scalarOrArray(function (mixin) {
            var mixins = this.prototype.mixins || [];
            if (-1 === mixins.indexOf(mixin)) {
                // add a reference to registered mixins
                mixins.push(mixin);
                // and extend prototype
                delegateMixin(this.prototype, mixin);
            }

            return this;
        }),

        // Removes a mixin from the object
        //
        // Accepts an array of mixins as it is wrapped with
        // `utils.scalarOrArray`.
        //
        // @param Array|Object  mixin   mixin to remove
        //
        // @return Mixin
        unmix: utils.scalarOrArray(function (mixin) {
            var mixins = this.prototype.mixins;
            var index = mixins.indexOf(mixin);
            if (-1 === mixins.indexOf(mixin)) {
                // mixin isn't applied
                return this;
            }

            // remove mixin from list
            mixins.splice(index, 1);
            undelegateMixin(this.prototype, mixin);

            return this;
        }),

        // helper function inspired by Backbone core extend function.
        extend: function (protoProps, staticProps) {
            var parent = this;
            var child;

            // The constructor function for the new subclass is either defined
            // by you (the "constructor" property in your `extend` definition),
            // or defaulted by us to simply call the parent's constructor.
            if (protoProps && _.has(protoProps, 'constructor')) {
                child = protoProps.constructor;
            } else {
                child = function(){ return parent.apply(this, arguments); };
            }

            // Add static properties to the constructor function, if supplied.
            _.extend(child, parent, staticProps);

            // Set the prototype chain to inherit from ̀parent`, without calling
            // `parent`'s constructor function.
            var Surrogate = function(){ this.constructor = child; };
            Surrogate.prototype = parent.prototype;
            child.prototype = new Surrogate;

            // Add prototype properties (instance properties) to the subclass,
            // if supplied.
            if (protoProps) _.extend(child.prototype, protoProps);

            // copy mixins reference
            child.prototype.mixins = _.clone(child.prototype.mixins || []);

            // Set a convenience property in case the parent's prototype is
            // needed later.
            child.__super__ = parent.prototype;

            return child;
        }
    });

    return Mixin;
});
