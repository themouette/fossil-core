Fossil Events
=============

Fossil.Mixins.Observable
--------------------

Fossil provides a mixin for observables under `Fossi.Mixins.Observable`.
This mixin extends `Backbone.Events` and add tha ability to:

* simply declare event listeners;
* create a communication point for other objects;
* allow eventModifier registration.

Here is a simple exemple:

``` javascript
// a new contstructor object
var Events = Mixin.extend({
    events: {
        'eventname': 'listener'
    }
});
// add the Observable behavior
Events.mix(Observable);
```

Built in events
---------------

### Observable

No events declared.

### Deferrable

No events declared.

### Startable

* `start:first`: triggered when startable is first started `function(startable)`
* `start`: triggered whenever startable is started `function(startable)`
* `standby`: triggered whenever startable is standby `function(startable)`
* `stop`: triggered whenever startable is stopped `function(startable)`

### Module

Following events are triggered by `Module`.

* `do:route:navigate` should be handled by routing. navigate to a url.
* `do:route:register` should be handled by routing. register a new route.
* `do:view:render` should be handled by template engine. render given view.
* `do:view:attach` should be handled by canvas. attach view to dedicated region.
* `do:connect:to:parent` command to handle child action when connected to a
  module.
* `on:child:connect` event triggered by a module when a child is connected.
* `do:disconnect:from:parent` command to handle child disconnection.
* `on:child:disconnect` event triggered when a child is disconnected.
* `on:service:use` event triggered when a new service is used.
* `on:service:dispose` event triggered when a service is disposed.

`Module` implements following mixins (and therefore triggers related events):

* `Observable`
* `Startable`

`Module` also provide a `parent!` event modifier to manipulate perent module
event (if any). All parent events are cached util module is connected, and are
immediately replayed when module is connected.

### Service

* `do:use:module` command to handle service use.
* `do:dispose:module` command to handle service disposal.

`Services` implements following mixins (and therefore triggers related events):

* `Observable`

### ViewStore

No events declared.

