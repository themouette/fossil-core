define([
    'underscore',
    'fossil/module',
    'fossil/viewStore',
    'fossil/views/view',
    './todo',
    './todoCollection',
    './listView',
    './showView'
], function (_, Module, ViewStore, View, Todo, TodoCollection, ListView, ShowView) {
    "use strict";
    var Application = Module.extend({

        events: {
            'start': 'startListener',
            'standby': 'standbyListener'
        },

        startListener: function (app) {

            var store = this.store = new ViewStore();

            store.decorateModule(this);

            store.set('404', function (message) {
                return new View({template: message || 'Not found'});
            });
            store.set('loading', function () {
                return new View({
                    template: '<p>Loading...</p>'
                });
            });
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
            // unbind any remaining event on todos collection.
            this.todos.stopListening();
            // and delete it.
            this.todos = null;

            this.viewStore.restoreModule(this);
            this.store.clean();
            this.store = null;
        },


        routes: {
            '': 'index',
            ':id': 'show'
        },

        index: function () {
            this.useView(this.store.get('list', this.todos));
        },

        show: function (id) {
            var todo = this.todos.get(id);

            if (!todo) {
                this.useView('404');
                return this;
            }

            var view = new ShowView({
                model: todo
            });
            this.useView(view);
        }
    });

    return Application;
});
