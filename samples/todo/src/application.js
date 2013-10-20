define([
    'fossil/module',
    'fossil/viewStore',
    './todo',
    './todoCollection',
    './listView',
    './showView'
], function (Module, ViewStore, Todo, TodoCollection, ListView, ShowView) {
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
        },


        routes: {
            '': 'index',
            ':id': 'show'
        },

        index: function () {
            console.log('index');
            var view = new ListView({
                collection: this.todos
            });

            this.useView(view);
        },

        show: function (id) {
            console.log('show');
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
