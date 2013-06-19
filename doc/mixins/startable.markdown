Fossil.Mixins.Startable
=======================

Add the ability to start, standby and stop an object.

> this mixin requires `Fossil.Mixins.Events` and `Fossil.Mixins.Deferrable`.

Usage
-----

### Start

To start `startable` object, just do `startable.start()`.

Triggers the event `start`. Listeners should use this prototype `function
onStart(startable)`.

When the object is started for the first time, the event `start:first` is
triggered.
Listeners should use this prototype `function onFirstStart(startable)`.

> If object is is already started, nothing happens.

### Standby

To put `startable` in standby, just do `startable.standby()`.
If object is not started, nothing happens. To resume `startable`, you have to
start the object again.

Triggers the event `standby`. Listeners should use this prototype `function
onStandby(startable)`.

### Stop

To put `startable` in stop, just do `startable.stop()`.
If object is not started, nothing happens. To resume `startable`, you have to
start the object again.

Triggers the event `stop`. Listeners should use this prototype `function
onStop(startable)`.

> Note that stopping an object standbys it first.

Error handling
--------------

All those events are deferrable. There is an automatic error handling for
asynchronous processes.

All you have to do is override `_startError` and `_stopError` callbacks.

Examples
--------

### Create a startable object

``` javascript
var Startable = function (){};
_.extend(
    Startable.prototype,
    Fossil.Mixins.Observable,
    Fossil.Mixins.Deferrable,
    Fossil.Mixins.Startable, {
    _firstStart: function () {
        // do stuff
        Fossil.Mixins.Startable._firstStart.apply(this, arguments);
        // do stuff
    },
    _doStart: function () {
        // do stuff
        Fossil.Mixins.Startable._doStart.apply(this, arguments);
        // do stuff
    },
    _doStandby: function () {
        // do stuff
        Fossil.Mixins.Startable._doStandby.apply(this, arguments);
        // do stuff
    },
    _doStop: function () {
        // do stuff
        Fossil.Mixins.Startable._doStop.apply(this, arguments);
        // do stuff
    }
});

startable = new Startable();
startable.start();
startable.stop();
```

