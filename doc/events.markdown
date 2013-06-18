Fossil Events
=============

Fossil.Mixins.Events
--------------------

Fossil provides a mixin for observables under `Fossi.Mixins.Events`.
This mixin extends `Backbone.Events` and add tha ability to:

* simply declare event listeners;
* create a communication point for other objects.

Here is a simple exemple:

``` javascript
// a new contstructor object
var Observable = function (options) {
    // allow options extension
    this.options = options || {};
    // bind events declared in the `event` property
    this.registerEvents();
}
// add the Observable behavior
_.extend(Observable.prototype, Fossil.Mixins.Events, {
    events: {
        // calls object.bar when foo event is triggered
        foo: 'bar',
        // invoke the function on 'some:event' event
        'some:event': funciton () {
            // bound to object context
            this.doSomething();
        }
    }
});
```

Built in events
---------------

### Fossil.Mixins.Events

No events declared.

### Fossil.Mixins.Layout

* `layout:setup`: triggered when layout is first rendered on $el
  `function(layoutable)`
* `layout:render`: triggered when layout is attached on DOM
  `function(layoutable)`
* `layout:remove`: triggered when layout is detached from DOM
  `function(layoutable)`

### Fossil.Mixins.Fragmentable

* `fragmentable:fragment:setup`: triggered when fragment is first rendered on
  $el `function(fragemnt, fragmentid, fragmentable)`
* `fragmentable:fragment:render`: triggered every time fragment is rendered
  `function(fragemnt, fragmentid, fragmentable)`
* `fragmentable:fragment:remove`: triggered every time fragment is removed
  `function(fragemnt, fragmentid, fragmentable)`
* `fragmentable:render`: triggered when fragment is rendered on DOM
  `function(fragmentable)`
* `fragmentable:remove`: triggered when fragment is removed from DOM
  `function(fragmentable)`

### Fossil.Application

Following events are triggered by `Fossil.Application`.

* `module:connect`: a new module is connected `function(module, path,
  application)`
* `factory:use`: a new factory is used `function(factory, factory_id,
  application)`
* `setup`: triggered when application setup begins  `function(application)`
* `start`: triggered when application initialization is over
  `function(application)`

`Fossil.Application` implements following mixins (and therefore triggers related
events):

* `Layout`
* `Fragmentable`
* `Events`

### Fossil.Module

Following events are triggered by `Fossil.Module`

* `setup`: triggered when module setup begins  `function(module, application)`
* `start`: triggered when module setup is over `function(module, application)`
* `teardown`: triggered when module teardown is over `function(module,
  application)`

`Fossil.Module` implements following mixins (and therefore triggers related
events):

* `Layout`
* `Fragmentable`
* `Events`

`Fossil.Application` Pub/Sub is available under `module.application`.
Application level events can be declared through `module.applicationEvents`
property.

### Fossil.Fragment
