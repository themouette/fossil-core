---
title: Getting started with Fossil
---

Through this tutorial, I'll show you how to build a simple todo application with
Fossil. Check out the
[result](http://themouette.github.io/fossil-core/samples/todo/).

To follow this tutorial, it is better to have some Backbone, bower and requirejs
understanding.

## Setup the project

First thing, go into an empty directory and initialize your project as both npm
and bower project, and install dependencies:

``` bash
$ npm init
$ bower init
$ npm install --save-dev grunt grunt-contrib-watch grunt-contrib-connect grunt-contrib-concat grunt-concurrent
$ bower install --save fossil-core fossil-view requirejs jquery backbone underscore
```

Once all dependencies are installed, copy the fossil skeleton application:

``` bash
$ cp -r bower_components/fossil-core/skeleton/{src,index.html,Gruntfile.js} .
```

Your directory should now look like

```

todo
|-- bower_components
|-- bower.json
|-- Gruntfile.js
|-- index.html
|-- node_modules
|-- package.json
`-- src
    |-- config.js
    `-- kernel.js

15 directories, 7 files
```

Launch grunt development task and open a browser:

``` bash
$ grunt dev --port 3000 & open http://localhost:3000
```

You should see a welcome message.

## The boot process

Open the
`[src/kernel.js](https://github.com/themouette/fossil-core/skeleton/src/kernel.js)`
file, this is the core of this new Fossil application.

This file already contains a boilerplate application start process:

> variables are injected through require.
> report to original file to learn more.

### Create services

Services are a way to extend modules with event listeners. Changing a behavior
is as easy as changing of service implementation.

``` javascript
// extend views with template engine dedicated methods, and handles template
// rendering.
var engine = new Engine();

// register module routes into main router.
var routing = new Routing();

// service in charge of rendering views.
// Using a service allow to compute extra data to rendering method.
var template = new Template({
        engine: engine
    });

// service in charge of attaching views to DOM.
//
// This is useful when embeding modules into others.
var canvas = new Canvas({
    selector: '#l-wrap'
});
```

### Start the application

App is started after all services have been registered.
Every service can be used and disposed at will.

``` javascript
var app = new Application();
app
    .use('routing', routing)
    .use('template', template)
    .use('canvas', canvas)
    .start();
```

## Create views and collections

This is typical Backbone code, just copy paste the following.

``` javascript
// src/todo.js
```

``` javascript
// src/todoCollection.js
```

``` javascript
// src/listView.js
```

``` javascript
// src/showView.js
```

## Create your application

Open the
`[src/application.js](https://github.com/themouette/fossil-core/skeleton/src/application.js)`

There is the module minimal code, so we are ready to create our routes, but
don't forget to update your application's `define` dependencies.

### Update require dependencies

``` javascript
// src/application.js
define([
    'fossil/module',
    './todo',
    './todoCollection',
    './listView',
    './showView'
], function (Module, Todo, TodoCollection, ListView, ShowView) {
```

### Create routes

Just as a `Backbone.Router` define your route mapping in a `routes` property.
Every route will be handled by routing service. `Backbone.Router`s are fine, but
do not fit module nesting model. Service allow prefixing and nesting natively.

A naive implementation for our Todo app would look like this:

``` javascript
var Application = Module.extend({
    routes: {
        '': 'index',
        ':id': 'show'
    },

    index: function () {
        var todos = new TodoCollection();
        var view = new ListView({
            collection: todos
        });

        this
            // set a loading message while fetching
            // todos remotely
            .useView('loading')
            // delay next actions until promise is resolved
            .waitFor(todos.fetch())
            // then use given view.
            .thenUseView(view);
    },

    show: function (id) {
        var todo = new Todo({id: id});
        var view = new ListView({
            model: todo
        });

        this
            .waitFor(todo.fetch())
            .thenUseView(view);
    }
});
```

### Initialization phase

Just as any Backbone object, a module accepts events as option or as part of its
prototype.

Module lifecycle provides the following events:

* `start:first`:
* `start`:
* `standby`:
* `stop`:

To hook into initialization phase, we'll use `start` event.

``` javascript
var Application = Module.extend({
    events: {
        'start': 'startListener',
        'standby': 'standbyListener'
    },

    startListener: function (app) {
    },

    standbyListener: function (app) {
    },

    /*
        routing code
    */
});
```

For now listeners are left empty. Just keep in mind that anything started should
be stopped during standby or stop event.

### Next steps

Here we are, there is a simple todo app that poorly does the job. Next part is
about make our application more user friendly by leveraging Fossil tools.

For instance, todos are reloode everytime user gets back to the list, this is
useless.

## Enhancement

### Use session service

### Use a view store

### Add Loading and Error pages

