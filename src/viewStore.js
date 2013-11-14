// A ViewStore provides views created from registered factories.
//
// All recycling views are stored for future re-use, other views are
// re-generated every time.
//
// ``` javascript
// module.on('start', function () {
//    // let's declare a new store
//    var store = new ViewStore();
//    // Add a 404 view when items are not found
//    store.set('404', function (message) {
//        return new View({template: message || "Not found"});
//    });
//    // Add a 500 view when unknown error occured
//    store.set('500', function (message) {
//        return new View({template: message || "Unknown error"});
//    });
//    // Add a list view to display colection
//    store.set('list', function (collection) {
//        return new CollectionView({
//            selector: 'ul',
//            collection: collection,
//            recycle: true,
//            template: '<ul></ul>',
//            itemView: View.extend({
//                tagName: 'li',
//                template: _.template('<%= name %>'),
//                getViewData: function () {return this.model.toJSON();}
//            })
//        });
//    });
// });
// // clean the store on module standby
// module.on('standby', _.bind(store.clean, store));
//
// // Create the collection
// var collection = new Backbone.Collection({
//     urlRoot: '/users'
// });
// module.route('foo', function () {
//     this
//         .abort()
//         .useView('Loading')
//         .waitFor(collection.fetch())
//         .thenUseView('list', '404');
// });
// ```
define(['underscore', './utils', './mixin'], function (_, utils, Mixin) {

    var ViewStore = Mixin.extend({
        // internal property to store view factories.
        //
        // @type Array
        factories: null,
        // internal property to store recycling views.
        //
        // @type Array
        views: null,

        // store constructor.
        //
        // ``` javascript
        // var store = new ViewStore();
        // ```
        constructor: function () {
            this.factories = _.clone(this.factories || {});
            this.views = _.clone(this.views || {});
            Mixin.apply(this, arguments);
            this.initialize.apply(this, arguments);
        },

        // A hook to alter behavior on initialize.
        //
        // constructor arguments are forwarded.
        initialize: function () { },

        // retreive a view by id.
        //
        // If view is recycling and already in store,
        // the previously created view is returned.
        //
        // If this is the first call or view is not recycling,
        // factory is called with provided extra parameters.
        //
        // ``` javascript
        // store.set('404', function (message) {
        //       return new View({message: message});
        // });
        // store.get('404', 'No elment with id 7');
        // ```
        get: function (id) {
            var view, factory;
            if (this.views[id]) {
                return this.views[id];
            }
            factory = this.factories[id];
            if (typeof(factory) === "function") {
                // forward extra arguments
                view = factory.apply(factory, _.rest(arguments, 1));
            } else {
                view = factory;
            }

            if (view && view.recycle) {
                this.views[id] = view;
            }

            return view;
        },

        // store a view factory.
        //
        // If a recycling view with `id` already exists,
        // it is first removed.
        //
        // Recycling views are stored for further use.
        // Other views are regenerated each time.
        //
        // ``` javascript
        // store.set('list', function (collection) {
        //       return new ListView({
        //           collection: collection,
        //           recyle: true
        //       });
        // });
        // store.set('show', function (item) {
        //       return new ItemView({
        //           model: item
        //       });
        // });
        // ```
        set: utils.keyValueOrObject(function (id, view) {
            if (this.views[id]) {
                this.views[id].remove();
            }
            this.factories[id] = view;

            return this;
        }),

        // check if a view is defined in the store.
        //
        // ```javascript
        // // replace module.useView function to look for view into store.
        // var __super = Module.prototype.useView;
        // module.useView = function (view) {
        //     var store = this.store;
        //     if (typeof(view) === "string" && store.has(view)) {
        //          return __super.apply(this, store.get.apply(store, arguments));
        //     }
        //
        //     return __super.apply(this, arguments);
        // }
        // ```
        has: function (id) {
            return this.views[id] || this.factories[id];
        },

        // remove all recycling views.
        //
        // The remove call is made using force,
        // so Fossil views are really removed.
        //
        // ```javascript
        // // remove all recycling views on stanby
        // module.on('standby', _.bind(store.clean, store));
        // ```
        clean: function () {
            _.each(this.views, function (view, id) {
                this.remove(id);
            }, this);
            this.factories = [];

            return this;
        },

        // Remove a view from store.
        //
        // The view is removed using the force parameter on `remove` method.
        //
        // ```javascript
        // store
        //      .remove('404')
        //      .remove('list');
        // ```
        remove: function (id) {
            if (this.views[id]) {
                this.views[id].remove(true);
            }
        }
    });

    return ViewStore;
});
