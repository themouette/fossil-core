Fossil.Application
==================

`Fossil.Application` is your application base class.
It is possible to use it directly or to extend it to your needs.

Use services
------------

`Fossil.Service`s can easily be plugged int application withe the `use` method:

``` !javascript
var app = new Fossil.App();
app
    .use('session', new Fossil.Services.Session());
    .start();
```

It is even possible to use services after start:

``` !javascript
var app = new Fossil.App();
app
    .use('session', new Fossil.Services.Session());
    .start();
```

Finaly, if yoou feel more like configuring, it is possible to declare services
through the `services` property:

``` !javascript
// extend with configuration
var myApp = Fossil.App.extend({
    services: {
        session: new Fossil.Services.Session()
    }
});
// instanciate app
var app = new myApp();
app
    .start();
```

> For now there is no way to unregister a service, not sure there will be.
> To switch off a service, call it's `stop` method.

Connect modules
---------------

Modules are the corner stone of fossil. It bundles your application into logical
pieces, that are started and stopped at will.

Connecting module makes it aware of the application and services. It also
associate a **routing prefix** for all the module routes, it can be overriden by the
`path` options.

Modules are connected through the `connect` method:

``` !javascript
var app = new Fossil.App();
app
    .connect('clients', new Fossil.Module());
    .connect('agenda', new Fossil.Module({path: 'calendar'}));
    .start();

// it is even possible to connect module after application is started
app
    .connect('events', new Fossil.Module({path: 'calendar/events'}));
```

If one prefer the configuration style, `modules` property can be set through
prototype or options:


``` !javascript
// extend with configuration
var myApp = Fossil.App.extend({
    modules: {
        clients: new Fossil.Module()
    }
});
// instanciate app
var app = new myApp();
app
    .start();
```

> ### Main module
>
> By default, routing enable a single module at a time, the **main module**. It
> is still possible to activate a module manualy.
>
> Application being layoutable, **main module** is attached to a DOM element
> matching `[data-fossil-placeholder="module"]` of the application.
>
> Events are triggered when **main module** changes:
>
> * `module:standby` when current module is standbyed;
> * `module:change` before new module is started;
> * `module:start` when module is up and running.

Routing
-------

Routing is handled by `Fossil.Services.Routing`, refer to dedicated
documentation for more information.

Routes are registered via the prototype or option `routes`.
Routes can either be:

* A **function** that will be executed in the application context;
* The name of a **method** of application to execute;
* The name of an **event** to trigger.

``` !javascript
// extend with configuration
var myApp = Fossil.App.extend({
    routes: {
        // will call the index method
        '': 'index',
        // will trigger event `routing:navigate:default`
        'default': 'routing:navigate:default',
        // call function
        'show/id': function (id) {
            alert(id);
        }
    },
    // index method is available
    index: function () {
        // forward to default
        this.navigate('default');
    }
});
// instanciate app
var app = new myApp();
app
    .start();
```

Events
------

Application is a `Fossil.Mixins.Observable`. events can be attached using the
`events` property or the `Backbone.Events` methods.

``` !javascript
// extend with configuration
var myApp = Fossil.App.extend({
    events: {
        // will call the start chat method
        'start:chat': 'startChat',
        // call function
        'log': function (message) {
            console.log(message);
        }
    },
    // index method is available
    startChat: function () {
        this.getModule('chat').start();
    }
});
// instanciate app
var app = new myApp();
app
    .start();
```

Full list of core events available in [events documentation](events.markdown).

Layout
------

Application can get a layout as defined in the `Fossil.Mixins.Layoutable` you
may refer to the [documentation](mixins/layoutable.markdown).
