Fossil.Mixins.Observable
========================

This mixin add observable abilities to an object. It is based on
`Backbone.Events`.

Usage
-----

### Expose object publisher/subscriber

It is possible to only expose the publisher/subscriber abilities through the
`observable.createPubSub(observer, property)` method.

In addition, all events decribed in the `observer[property]` will automatically
be attached to the observable.

### registerEvents

Automatically subscribe to events described in the event object of the
observable.

Example
-------

### create pubsub

``` javascript
var observable = {};
_.extends(observable, Fossil.Mixins.Observable);

var observer = {
    ancestorEvents: {
        foo: 'bar'
    },
    bar: function () {
    }
}

observer.pubsub = observable.createPubSub(observer, 'ancestorEvents');

observable.trigger('foo'); // calls observer.bar
observer.pubsub.trigger('foo'); // does the same
```

### Full example for event registration

``` javascript
var Observable = function (options){
    this.options = options;
};
_.extend(
    Observable.prototype,
    Fossil.Mixins.Observable, {
        events: {
            // call mymethod on foo event.
            'foo': 'mymethod',
            // execute function on bar event.
            'bar': function () {
                this.something();
            }
        },
        mymethod: function () {
        }
    }
);

new Observable({
    events: {
        // execute function on baz event.
        baz: 'mymethod',
        // override prototype event binding
        foo: funcion () {
            this.trigger('baz');
        }
    }
});
```
