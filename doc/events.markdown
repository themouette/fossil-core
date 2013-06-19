Fossil Events
=============

Fossil.Mixins.Observable
--------------------

Fossil provides a mixin for observables under `Fossi.Mixins.Observable`.
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
_.extend(Observable.prototype, Fossil.Mixins.Observable, {
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

### Fossil.Mixins.Observable

No events declared.

### Fossil.Mixins.Elementable

* `elementable:attach`: triggered when element is attached to object
  `function(elementable)`
* `elementable:detach`: triggered when element is detached from object
  `function(elementable)`

### Fossil.Mixins.Layoutable

* `layout:start`: triggered when layout is first rendered on $el
  `function(layoutable)`
* `layout:render`: triggered when layout is attached on DOM
  `function(layoutable)`
* `layout:remove`: triggered when layout is detached from DOM
  `function(layoutable)`

### Fossil.Mixins.Fragmentable

* `fragmentable:fragment:start`: triggered when fragment is first rendered on
  $el `function(fragemnt, fragmentid, fragmentable)`
* `fragmentable:fragment:render`: triggered every time fragment is rendered
  `function(fragemnt, fragmentid, fragmentable)`
* `fragmentable:fragment:remove`: triggered every time fragment is removed
  `function(fragemnt, fragmentid, fragmentable)`
* `fragmentable:render`: triggered when fragment is rendered on DOM
  `function(fragmentable)`
* `fragmentable:remove`: triggered when fragment is removed from DOM
  `function(fragmentable)`

### Fossil.Mixins.Startable

* `start:first`: triggered when startable is first started `function(startable)`
* `start`: triggered whenever startable is started `function(startable)`
* `standby`: triggered whenever startable is standby `function(startable)`
* `stop`: triggered whenever startable is stopped `function(startable)`

### Fossil.Application

Following events are triggered by `Fossil.Application`.

* `module:connect`: a new module is connected `function(module, path,
  application)`
* `service:use`: a new service is used `function(service, service_id,
  application)`

`Fossil.Application` implements following mixins (and therefore triggers related
events):

* `Layoutable`
* `Fragmentable`
* `Observable`
* `Startable`

### Fossil.Module

`Fossil.Module` implements following mixins (and therefore triggers related
events):

* `Layoutable`
* `Fragmentable`
* `Observable`
* `Startable`

`Fossil.Application` Pub/Sub is available under `module.application`.
Application level events can be declared through `module.applicationEvents`
property.

### Fossil.Fragment

`Fossil.Fragment` implements following mixins (and therefore triggers related
events):

* `Layoutable`
* `Fragmentable`
* `Observable`
* `Startable`
