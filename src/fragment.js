define([
    'fossil/core',
    'fossil/mixins/events',
    'fossil/mixins/layout',
    'fossil/mixins/fragmentable'
], function (Fossil) {

    var Fragment = Fossil.Fragment = function (container, options) {
        this.options = options || {};
        this.registerEvents();
        this.initFragmentable();
        this.container = container.createPubSub(this, 'parentEvents');
        this.path = container.path || '';
        this.initialize.apply(this, arguments);
    };
    _.extend(Fragment.prototype, Fossil.Mixins.Events, Fossil.Mixins.Layout, Fossil.Mixins.Fragmentable, {
        initialize: function () {},
        fagments: {},
        render: function () {
            this.renderLayout();
            this.$el = this.layout.$el;
            return this;
        }
    });

    Fragment.extend = Backbone.Model.extend;

    return Fragment;
});
