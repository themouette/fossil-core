Mixin
=====

Mixin is a base class providing 2 types of extension points:

* `extend` creates an inherited class;
* `mix` extends current class with provided mixin.

Mixins can extend the constructor behavior by providing an `initialize` method.

``` js
var MyObject = Mixin.extend({
    // it is possible to replace the constructor
    // just provide a constructor method !
    constructor: function () {
        // call parent whenever you need
        Mixin.apply(this, arguments);
    },

    // add a new `foo` method
    foo: function () {
        // do something amazing
    }
});

MyObject.mix({
    // The `initialize` method is called during object
    // instanciation and recieves the constructor
    // arguments.
    initialize: function () { },

    // this method will be copied into MyObject.prototype
    bar: function () { },

    // will not override native method
    // to overwrite existing method, do it directly
    // and call the mixin method in object context.
    foo: function () { }
});
```
