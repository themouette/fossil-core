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
```

Launch grunt development task and open a browser:

``` bash
$ grunt dev --port 3000 & open http://localhost:3000
```

You should see a welcome message.

## The Kernel aka Boot Process

Open the
[`src/kernel.js`](https://github.com/themouette/fossil-core/skeleton/src/kernel.js)
file, this is the core of this new Fossil application.

This file already contains a boilerplate application start process, let's review
it:

> Note that variables are injected through require, please report to original
> file to learn more.

### First Step: Create Services

Services are a way to extend modules with event listeners. Changing a behavior
is as easy as changing service implementation.

``` javascript
// extend views with template engine dedicated methods, and handles template
// rendering.
var engine = new Engine();

// register module routes into main router.
var routing = new Routing();

// service in charge of rendering views.
// Using a service allow to compute extra data to rendering method.
// For instance it become possible to add helpers on a module basis.
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

### Second Step: Start the application

Application is started after all services have been registered.
Every service can be used and disposed at will.

``` javascript
var app = new Application();
app
    // activate services for application
    .use('routing', routing)
    .use('template', template)
    .use('canvas', canvas)
    // and finaly start.
    .start();
```

This is all you need to start a Fossil application.

> During Alpha stage, Canvas service needs some more work. Because of that, you
> are required to add some initialization code:
>
> ``` javascript
> var app = new Application({
>     // define canvas region to use
>     // Canvas is created from initial page HTML
>     region: 'content'
> });
> app.
>     .on('start:first', function () {
>         // define a region on the canvas of service "canvas".
>         canvas.canvas.defineRegion('content', '.content');
>     })
> ```
>
> This boilerplate code should be removed before beta release and the selector
> value should be used as root element for views, unless a canvas is explicitely
> defined.

## Create views and collections

This is typical Backbone code, just copy paste the following.

``` javascript
// src/todo.js
define(['backbone'], function (Backbone) {
    return Backbone.Model.extend({});
});
```

``` javascript
// src/todoCollection.js
define(['backbone', 'todo'], function (Backbone, Todo) {
    return Backbone.Collection.extend({
        model: Todo,
        url: './tasks.json'
    });
});
```

``` javascript
// src/listView.js
define([ 'fossil/views/collection', 'fossil/views/collection' ], function (View, CollectionView) {

    var ItemView = View.extend({
        tagName: 'li',
        template: '<a href="#<%= id %>"><%= title %></a>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    var ListView = CollectionView.extend({
        selector: 'ul',
        ItemView: ItemView,
        template: '<ul></lu>'
    });

    return ListView;
});
```

``` javascript
// src/showView.js
define([ 'fossil/views/view' ], function (View) {

    var ShowView = View.extend({
        template: '<p><%= title %></p><a href="#">List</a>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    return ShowView;
});
```

``` javascript
// tasks.json
[
    {"id": 0, "title": "foo"},
    {"id": 1, "title": "bar"},
    {"id": 2, "title": "baz"},
    {"id": 3, "title": "foobar"},
    {"id": 4, "title": "Learn more about Fossil"},
    {"id": 5, "title": "Use Handlebars"}
]
```

## Create Application

Open the
[`src/application.js`](https://github.com/themouette/fossil-core/skeleton/src/application.js)
to see a module minimal code.

In Fossil, modules are isolated pieces of application, exposing their API
through event dispatchers. A module can connect children modules, as deeply
nested as you wish. If configured to do so, services will be used on children
modules as well. This is the way Fossil achieves reusability.

This section demonstrates how to build the Todo module, that is our main
application.

### Update require dependencies

First thing first, module dependencies must be updated to import views and
models.

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

### Initialization Phase

Just as any Backbone object, a module accepts events as option or as part of its
prototype.

> Module lifecycle provides the following events:
>
> * `start:first`:
> * `start`:
> * `standby`:
> * `stop`:
>
> Keep in mind that a module should cleans itself when it is stopped/standbyed,
> so everything that is created on start should be destroyed on standby/stop.

Todo application needs to fetch todos on start, and to release collection on
standby.

``` javascript
var Application = Module.extend({
    events: {
        'start': 'startListener',
        'standby': 'standbyListener'
    },

    startListener: function (app) {
        // initialize collection.
        var todos = this.todos = new TodoCollection();

        this
            // set view while loading.
            //
            // When `useView` receives a string, it is used as template.
            .useView('Loading')
            // event processing can delay next execution until
            // a set of promises are resolved.
            //
            // So wait until all Todos are retreived from remote store.
            .waitFor(todos.fetch())
            // if an error occurs, 'Error' will be displayed.
            .thenUseView(null, 'Error');
    },

    standbyListener: function (app) {
        // undind any remaining event on todos collection.
        this.todos.stopListening();
        // and delete it.
        this.todos = null;
    }
});
```

### Create routes

Just as a `Backbone.Router` define your route mapping in a `routes` property.
Every route will be handled by routing service. `Backbone.Router`s are fine, but
do not fit module nesting model. Service allow prefixing and nesting natively.

A naive implementation for our Todo app would look like this:

``` javascript
var Application = Module.extend({

    /*
        events code
    */

    routes: {
        '': 'index',
        ':id': 'show'
    },

    index: function () {
        var view = new ListView({
            collection: this.todos
        });

        this.useView(view);
    },

    show: function (id) {
        var todo = this.todos.get(id);

        if (!todo) {
            this.useView('404');
            return this;
        }

        var view = new ListView({
            model: todo
        });
        this.useView(view);
    }
});
```

### Next steps

Here we are, there is a simple todo app that poorly does the job. Next part is
about make our application more user friendly by leveraging Fossil tools.

For instance, index view is recreated every time user gets back to the list, this
is useless, Fossil provides easy view reuse capabilities.

Another Enhancement that should be done before going in production is providing
real error and not found views.

Fossil is all about having modules working together, it should be shown.

Event modifiers should be shown either.

## Enhancement

### Define helpers

Fossil provides a way to define engine agnostic templates. During the alpha
stage, there is no simple escaping methods, but it will come eventually.

In this chapter, we'll see how to create url related helpers. Provided helpers
are not perfect, but demonstrates how it works.

First helper is `url` helper, generating and absolute url from provided
fragments and prefixing result with module url prefix.
This template is registered on template service, but can be module specific.

> To register a helper on a module, use the `do:register:helper` event, with the
> exact same parameters as the `template.helper` function.

``` javascript
// src/kernel.js
template.helper('url', function () {
    // last argument is always the extra data.
    // extra data are as follow:
    // {
    //     helpers: {/* list of all available helpers */},
    //     data: {
    //         view: /* the current rendering view, be careful with nesting rendering as it will be the parent view */,
    //         module: /* the current rendering module */
    //     }
    // }
    var extra = _.last(arguments);
    // fragments are all but the last argument
    var fragments = _.initial(arguments, 1);
    // module `url` is computed by Routing service from module urlRoot option
    // and parent modules.
    // A real implementation would use a Routing service generate method.
    return '#' + (extra.data.module.url || '' ) + fragments.join('');
});
template.helper('linkTo', function (title, url) {
    var extra = _.last(arguments);
    // fragments are all but title and extra arguments
    var fragments = _.initial(_.tail(arguments));
    // note that it is possible to call other helpers in helper.
    return '<a href="' + extra.helpers.url.apply(this, fragments) +'">'+title+'</a>';
});
```

All there is to do now is to update view templates as follow:

``` javascript
// src/showView.js
var ShowView = View.extend({
    template: '<p><%= title %></p><%= linkTo("List", "") %>',
    /* ... */
});
// src/listView.js
var ItemView = View.extend({
    tagName: 'li',
    template: '<%= linkTo(title, id) %>',
    /* ... */
});
```

So It is possible to use scoped helpers, but there is more: It is possible to
**attach dom behaviors from helpers**.

Relying on `fossil-view` 'do:attach:plugins' event, here is how to define a
`buttonTo` helper, calling Routing service to

``` javascript
// src/kernel.js
template.helper('buttonTo', function (title, url) {
    var id = "b_"+_.uniqueId();
    var extra = _.last(arguments);
    var view = extra.data.view;
    var module = extra.data.module;
    url = extra.helpers.url(url);

    // Once DOM is attach, generated button receives a onClick listener
    view.once('on:plugins:attach', function () {
        $('button[data-fossil-id='+id+']').on('click', _.bind(module.navigate, module, url, {trigger: true, replace: true}));

        // and when view is detached from DOM, event listener is removed.
        view.once('on:plugins:detach', function () {
            $('button[data-fossil-id='+id+']').off('click');
        });
    });

    return '<button data-fossil-id="'+id+'">'+title+'</button>';
});
```

If you ask me, this is a Fossil killer feature, it becomes possible to define
reusable UI plugins.

### Use a view store

Backbone views are great, and often there is no need to recreate them, as they
change along with data.

Some people calls it zombies, but to me this is a feature. Fossil helps you
leveraging this powerfull Backbone feature with no risk thanks to ViewStore.

A ViewStore accepts view factories, and instanciates views on demand. To prevent
view reinstanciation every time it is requested, all you need is to pass
`recycle` option to true.

For this example,

``` javascript
// src/application.js
define([
    'fossil/module',
    'fossil/viewStore',  // add viewStore
    'fossil/views/view', // and Fossil base view
    './todo',
    './todoCollection',
    './listView',
    './showView'
], function (Module, ViewStore, View, Todo, TodoCollection, ListView, ShowView) {
var Application = Module.extend({

    startListener: function () {
        var store = this.store = new ViewStore();
        store.set('list', function (collection) {
            return new ListView({
                collection: collection,
                // reuse the view
                recycle: true
            });
        });
        store.set('show', function (collection, id) {
            return new ShowView({
                model: collection.get(id)
            });
        });

        /*
            previous code
        */

    },

    standbyListener: function (app) {

        /*
            previous code
        */

        this.store.clean();
        this.store = null;
    },
});
```

A simple application extension add the ability to pass view key to `useView`:

``` javascript
// src/application.js
var Application = Module.extend({

    /*
        previous code
    */

    // retrive or instanciate a view from store
    useView: function (name, options) {
        if (this.store.has(name)) {
            return Module.prototype.useView.call(this, this.store.get.apply(this.store, arguments));
        }
        return Module.prototype.useView.apply(this, arguments);
    }
});
```

From now on, list relies on CollectionView behavior to keep in sync with
collection and will not be rerendered.

### Add Loading and Error pages

Thanks to previous code, it becomes super easy to replace our '404' and 'loading' views:

``` javascript
// src/application.js

// Add this during store initialisation
store.set('404', function (message) {
    return new View({template: message || 'Not found'});
});
store.set('loading', function () {
    return new View({
        template: '<p>Loading...</p>'
    });
});
```

This is great for progressive enhancement, don't you think ?

