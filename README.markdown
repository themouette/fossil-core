Fossil core components
======================

Fossil is yet another framework built on top of
[Backbone.JS](http://backbonejs.org).

It aims at easing and speed up development of large single page applications.

For now it relies on AMD, but it should soon be possible to use it as raw
javascript.

Install
-------

```
$ git clone https://github.com/themouette/fossil-core.git && npm install
```

Simple example
--------------

This is a very basic example. Even if Fossil is built to scale on large
applications, you can build small thing with no overhead.
To have an example using all Fissil concepts, look at

``` javascript
var MyApplication = Fossil.Application.extend({
    // services are extesion points
    // we'll only use routing for now
    services: {
        'routing': Fossil.Services.Routing
    },
    // define route events
    routes: {
        // binding routes to events helps in scaling.
        // it becomes easy to refactor and separate your code base.
        '': 'route:index',
        'contacts': 'route:contacts'
    },
    events: {
        'route:index': function () {
            var user = $.get('/api/user');
            this
                // abort any previous async process
                .abort()
                // wait for the user request to complete
                .waitFor(user)
                // when it's done, renderUser
                .thenWith(this, this.renderUser, this.showError);
        },
        'route:contacts': function () {
            // abort any previous async process
            this.abort();
            // load contacts if not already there
            if (!this.contact) {
                this.contacts = new ContactCollection();
                this.showLoading();
                this.waitFor(this.contacts.fetch(), {timeout: 1000});
            }
            // if no async is request it will be executed right now
            // otherwise, it will be deferred until collection is loaded
            this.thenWith(this, this.renderContactList, this.showError);
        }
    },

    // referecne element for the application
    selector: 'body',
    // When template is null, the selector content is used as layout.
    // it becomes easy to define layout in the page loaded from server.
    template: null,

    showError: function (error) {
        this.$('.main').html(error.message);
    },
    showLoading: function () {
        this.$('.main').html('loading');
    },
    renderUser: function () {
        this.$('.main').html('User is ready');
    },
    renderContactList: function () {
        this.$('.main').html([
            '<ul>',
                '<li>',
                    this.contacts.pluck('name').join('</li><li>'),
                '</li>',
            '</ul>'
        ].join(''));
    },
    initialize: function () {
        this.start();
    }
});

new MyApplication();
```

Core concepts
-------------

To build a `Application`, you connect multiple `Module`s and use several
`Service`s. There is also reusable pieces of UI called Fragments.

Those 4 parts are what makes Fossil flexible, but your really just need
`Application` and `Service`s.

### Application

Put in it your core logic, everything that is common to your whole application.
It provides an event dispatcher (Publisher/SUbscriber) and handy ways to
achieve your goal through configuration.

### Module

Every Module is indepent from the others, and might be easy to reuse in
other applications.
It also provides an event dispatcher, and can access to the application's one
either.

### Service

It is a piece of logic shared by all modules and the application.
Some services are built into Fossil, such as `Session` and `Routing`. More
should come quickly.

### Fragment

Every Fragment is independant piece of UI with logic. It communicates with
ancestor (it can be the Application or a Module) through a pubsub.
A fragment can contain fragments too.

We want code !
--------------

So here is a sample application:

``` javascript
// For now, AMD is needed
define([
    "jquery",
    "fossil/fossil"
], function ($, Fossil) {

    var MyApplication = Fossil.Application.extend({
        // all routes are bound to a application wide event.
        // it is possible to register routes on Application
        // and Module.
        routes: {
            // index route will trigger 'route:index' event.
            '': 'route:index'
        },
        // easily bind events
        events: {
            'route:index': function () {
                // forward to 'mails' url.
                this.services.router.navigate('mails', {replace: false})
            }
        }
    });

    var MailModule = Fossil.Module.extend({
        routes: {
            // main module route will trigger 'route:mail:index'
            '': 'route:mail:index',
            // show route
            ':id': 'route:mail:show'
        },
        // register listeners on application event dispatcher
        applicationEvents: {
            // main route will call index function
            'route:mail:index': 'index',
            // show route will call show function
            'route:mail:show': 'show'
        },
        // some module level events
        events: {
            // call when module is selected
            'setup': function () {
                console.log('setup mails');
                $('body').html([
                    '<h1>Mails</h1>',
                    '<ul>',
                        '<li><a href="#mails">mails</a></li>',
                        '<li><a href="#mails/1">mail 1</a></li>',
                        '<li><a href="#contacts">contacts</a></li>',
                    '</ul>'
                ].join(''));
            },
            // called on module switch
            'teardown': function () {
                console.log('teardown mails');
            }
        },
        // our methods
        index: function () {
            console.log('mail index');
        },
        show: function (mailId) {
            console.log('show mail ' + mailId);
        }
    });

    var ContactModule = Fossil.Module.extend({
        routes: {
            // main module route will trigger 'route:contact:index'
            '': 'route:contact:index',
            // show route
            ':id': 'route:contact:show'
        },
        // register listeners on application event dispatcher
        applicationEvents: {
            // main route will call index function
            'route:contact:index': 'index',
            // show route will call show function
            'route:contact:show': 'show'
        },
        // some module level events
        events: {
            // call when module is selected
            'setup': function () {
                console.log('setup contacts');
                $('body').html([
                    '<h1>Contacts</h1>',
                    '<ul>',
                        '<li><a href="#contacts">contacts</a></li>',
                        '<li><a href="#contacts/1">contact 1</a></li>',
                        '<li><a href="#mails">mails</a></li>',
                    '</ul>'
                ].join(''));
            },
            // called on module switch
            'teardown': function () {
                console.log('teardown contacts');
            }
        },
        // our methods
        index: function () {
            console.log('contact index');
        },
        show: function (contactId) {
            console.log('show contact ' + contactId);
        }
    });

    // create and start the application
    var application = new MyApplication({
        services: {
            'session': Fossil.Services.Session,
            'router': new Fossil.Services.Routing({
                    // create a link on modules
                    // to access router via this.router
                    linkToModule: true
                })
        },
        modules: {
            // all routes for Mail module
            // will be prefixed with "mail"
            // you can use whatever you want
            'mails': MailModule,
            // all routes for Contact module
            // will be prefixed with "contact"
            'contacts': ContactModule
        }
    });

    // finaly, start application.
    application.start();
});
```

Commands
--------

### Testing

```
$ npm test
```

### Dev mode

It launches a local server and watcher to build project automaticaly.

```
$ npm start
```
project is available under `http://localhost:8000`

### Tests

```
$ npm test
```
