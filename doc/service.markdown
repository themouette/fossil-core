Fossil.Service
==============

Base class for fossil services.
A fossil service is a business object with a single responsability, shared
accross all elements in the `services` property.

Usage
-----

### Create and pass a new Service

In this example, is shown the different way to access services methods.

``` javascript
var MyService = Fossil.Service.extend({
    options: {
        // extends application with service methods
        exposeToApplication: true,
        // create a direct access to service instance in fragments
        linkToFragment: true
    },
    exposedMethods: ["greet"],
    greet: function () {
        console.log('Hello !');
    }
});

var application = new Fossil.Application({
    fragments: {'frag1', Fossil.Fragment}
});
var module = new Module();
application
    .use('service1', new MyService())
    .connect('foo', module);

// for readabilyty
var fragment = application.ensureFragment('frag1')
```

For every element, it is possible to access service and call `greet` method
directly.

``` javascript
application.services.service1.greet();
module.services.service1.greet();
fragment.services.service1.greet();
```

As service is `exposed` to application, `greet` is directly accessible on
itself. You can specify `expose`, `exposeToApplication`, `exposeToModule` and
`exposeToFragment` options.

``` javascript
application.greet();
```

A linked service can be access on the element directly. You can specify
`link`, `linkToApplication`, `linkToModule` and `linkToFragment` options.

``` javascript
fragment.service1.greet();
```

### Add listeners

``` javascript
var MyService = Fossil.Service.extend({
    // activate service on application.
    _doActivateApplication: function (application) {
        this.listenTo(application, 'start', _.bind(this.applicationStartListener, this, application));
    },
    // suspend service on application.
    _doSuspendApplication: function (application) {
        this.stopListening(application);
    },
    // create region manager
    applicationStartListener: function (application) {

    },

    // Following hooks are also available

    // activate service on module.
    _doActivateModule: function (module, application, id) { },
    // suspend service on module.
    _doSuspendModule: function (module, application, id) { },
    // activate service on fragment.
    _doActivateFragment: function (fragment, parent, id) { },
    // suspend service on fragment.
    _doSuspendFragment: function (fragment, parent, id) { }
});
```


