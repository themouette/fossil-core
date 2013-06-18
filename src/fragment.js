define([
    'fossil/core',
    'fossil/mixins/events',
    'fossil/mixins/layout',
    'fossil/mixins/elementable',
    'fossil/mixins/fragmentable'
], function (Fossil) {

    var Fragment = Fossil.Fragment = function (container, options) {
        this.options = options || {};
        this.path = container.path || '';
        this.registerEvents();
        this.initFragmentable();
        this.container = container.createPubSub(this, 'parentEvents');
        this.initialize.apply(this, arguments);
    };
    _.extend(Fragment.prototype,
        Fossil.Mixins.Events,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layout,
        Fossil.Mixins.Fragmentable, {
            initialize: function () {},
            fagments: {},
            setup: function () {
                this.renderLayout();
                this.renderFragments();
            },
            teardown: function () {
                this.removeFragments();
                this.removeLayout();
            },
            render: function () {
                this.setup();
                return this;
            },
            remove: function () {
                this.teardown();
                return this;
            }
    });

    Fragment.extend = Backbone.Model.extend;

    return Fragment;
});
