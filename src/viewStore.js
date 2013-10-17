define(['underscore', './utils', './mixin'], function (_, utils, Mixin) {

    var ViewStore = Mixin.extend({
        factories: null,
        views: null,

        constructor: function () {
            this.factories = _.clone(this.factories || {});
            this.views = _.clone(this.views || {});
            Mixin.apply(this, arguments);
            this.initialize.apply(this, arguments);
        },

        initialize: function () {
        },

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

        set: utils.keyValueOrObject(function (id, view) {
            if (this.views[id]) {
                this.views[id].remove();
            }
            this.factories[id] = view;

            return this;
        }),

        has: function (id) {
            return this.views[id] || this.factories[id];
        }
    });

    return ViewStore;
});
