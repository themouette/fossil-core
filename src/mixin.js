define(['underscore', './utils'], function (_, utils) {
    "use strict";

    var specials = ['initialize'];
    // check wether given key is a special mixin key
    // that should not be imported on
    function isSpecialFunction(name) {
        return (-1 !== specials.indexOf(name));
    }

    function delegateMixin(self, mixin) {
        _.each(mixin, function (method, name) {
            if (!self[name] && !isSpecialFunction(name)) {
                self[name] = method;
            }
        });
    }

    function undelegateMixin(self, mixin) {
        _.each(mixin, function (method, name) {
            if (!isSpecialFunction(name) && method === self[name]) {
                delete self[name];
            }
        });
    }

    function Mixin() {
        var self = this;
        var args = arguments;

        // call mixins with arguments
        _.each(this.mixins, function (mixin) {
            if (typeof(mixin.initialize) === "function") {
                mixin.initialize.apply(self, args);
            }
        });
    }

    // An array to store mixins.
    // this belongs to the Mixin protype so constructor is able to iterate over
    // available mixins.
    Mixin.prototype.mixins = [];

    _.extend(Mixin, {
        // Register a mixin on the object.
        //
        // All methods are copied into the object prototype
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
        // removes a mixin from the object
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
