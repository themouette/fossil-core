Fossil core components
======================

Fossil is yet another framework built on top of
[Backbone.JS](http://backbonejs.org).

It aims at easing and speed up development of large single page applications.

For now it relies on AMD, but it should soon be possible to use it as raw
javascript.

Core concepts
-------------

To build a `Project`, you connect multiple `Application`s and use several
`Factory`-s.

Those 3 parts are what makes Fossil extensible.

### Project

Put in it your core logic, everything that is common to your whole project.
It provides an event dispatcher (Publisher/SUbscriber) and handy ways to
achieve your goal through configuration.

### Application

Every Application is indepent from the others, and might be easy to reuse in
other projects.
It also provides an event dispatcher, and can access to the project's one
either.

### Factory

It is a piece of logic shared by all applications and the project.
Some factories are built into Fossil, such as `Session` and `Routing`. More
should come quickly.

We want code !
--------------

So here is a sample project:

``` javascript
// For now, AMD is needed
define([
    "jquery",
    "fossil/fossil"
], function ($, Fossil) {

    var MyProject = Fossil.Project.extend({
        // all routes are bound to a project wide event.
        // it is possible to register routes on Project
        // and Application.
        routes: {
            // index route will trigger 'route:index' event.
            '': 'route:index'
        },
        // easily bind events
        events: {
            'route:index': function () {
                // forward to 'mails' url.
                this.factories.router.navigate('mails', {replace: false})
            }
        }
    });

    var MailApplication = Fossil.Application.extend({
        routes: {
            // main application route will trigger 'route:mail:index'
            '': 'route:mail:index',
            // show route
            ':id': 'route:mail:show'
        },
        // register listeners on project event dispatcher
        projectEvents: {
            // main route will call index function
            'route:mail:index': 'index',
            // show route will call show function
            'route:mail:show': 'show'
        },
        // some application level events
        events: {
            // call when application is selected
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
            // called on application switch
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

    var ContactApplication = Fossil.Application.extend({
        routes: {
            // main application route will trigger 'route:contact:index'
            '': 'route:contact:index',
            // show route
            ':id': 'route:contact:show'
        },
        // register listeners on project event dispatcher
        projectEvents: {
            // main route will call index function
            'route:contact:index': 'index',
            // show route will call show function
            'route:contact:show': 'show'
        },
        // some application level events
        events: {
            // call when application is selected
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
            // called on application switch
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

    // create and start the project
    var project = new MyProject({
        factories: {
            'session': Fossil.Factories.Session,
            'router': new Fossil.Factories.Routing({
                    // create a link on applications
                    // to access router via this.router
                    linkToApplication: true
                })
        },
        applications: {
            // all routes for Mail application
            // will be prefixed with "mail"
            // you can use whatever you want
            'mails': MailApplication,
            // all routes for Contact application
            // will be prefixed with "contact"
            'contacts': ContactApplication
        }
    });

    // finaly, start project.
    project.start();
});
```
