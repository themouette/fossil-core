define([
    'fossil/core',
    'fossil/mixins/events',
    'fossil/mixins/layout',
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
    _.extend(Fragment.prototype, Fossil.Mixins.Events, Fossil.Mixins.Layout, Fossil.Mixins.Fragmentable, {
        initialize: function () {},
        fagments: {},
        render: function ($el) {
            this.renderLayout($el);
            this.$el = this.layout.$el;
            this.renderFragments(this.$el);
            return this;
        },
        remove: function () {
            this.removeFragments();
            this.removeLayout();
        }
    });

    Fragment.extend = Backbone.Model.extend;

    return Fragment;
});
