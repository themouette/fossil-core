---
title: Fossil services
---

A service is a piece of code that solve a unique problem.

The service approach allow code to be unit testable, and make it easy to change
or optimize a part of your application.

Fossil comes with some base services to solve very common problems:

* `Canvas` manage layout and append views
* `Events` provides an application wide event dispatcher
* `Routing` handle application routing
* `Session` add a data store to share objects with other components
* `Template` handle view rendering

## Use a service

A service can be used by a module, it is as simple as calling `use` method:

``` javascript
myModule.use('servicename', new MyService());

// OR

myModule.use({
    'serv1': new Serv1,
    'serv2': new Serv2
});
```

> **Note**: You can access services through the `services` property:
>
> ``` javascript
> myModule.services.serv1
> ```
>
> But, it is a better practice to use module event dispatcher.

## Service disposal

Disposing a service is as easy as calling `dispose` method:

``` javascript
myModule.dispose('servicename');

// OR

myModule.dispose([ 'serv1', 'serv2' ]);
```

## Interact with module

**A service hooks into the module it is used by, only this service.**

To hook into all submodules registered or to be registered, you must handle this
at the service level. Hopefully the base `Service` class provides this
mechanism.

If you do not extend the Fossil base Service, it is advised to offer a single
option `deepUse` to turn on and off the ability to register deeply.

By the way, in case a service with the same id is already in use, it will be
disposed first.

### On the service side

If the service provides a `trigger` method, it is used to trigger a
'do:use:module'. Listeners accepts callbacks `function (module, id, service) {}`
and receive extra arguments.

This is the prefered way to interact with module.

To listen to service disposal, listen to service 'do:dispose:module' event. It
accepts callbacks with `function (module, id, service) {}` signature, and extra
arguments are forwarded.

### On the module side

It is possible to catch service registration on a module through the event
'on:service:use'. This event accepts callbacks `function (service, id, service)
{}` and receive extra arguments.

To listen to service disposal, listen to module 'on:service:dispose' event. It
accepts callbacks with `function (service, id, module) {}` signature, and extra
arguments are forwarded.

## Inherit Fossil default Service class

An example tells more than any explanation:

``` javascript
define(['fossil/service'], function (Service) {
    return Service.extend({

        initialie: function (options) {
            /* called on service instanciation */
        },

        use: function (module, parent) {
            /* called whenever a module use our service */
        },

        dispose: function (module, parent) {
            /* called whenever a module dispose our service */
        }

    });
});
```

> Note that parent argument is the parent module if any. This is revelant only
> when `useDeep` property or option is true.
>
> ``` javascript
> new MyService({useDeep: true});
> ```
