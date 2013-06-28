define([
    'fossil/core',
    'fossil/mixins/events',
    'fossil/mixins/layoutable',
    'fossil/mixins/elementable',
    'fossil/mixins/fragmentable'
], function (Fossil) {

    var Fragment = Fossil.Fragment = function (container, options) {
        this.options = options || {};
        this.services = {};
        this.path = container.path || '';
        this.registerEvents();
        this.initFragmentable();
        this.container = container.createPubSub(this, 'parentEvents');
        this.initialize.apply(this, arguments);
    };
    _.extend(Fragment.prototype,
        Fossil.Mixins.Events,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layoutable,
        Fossil.Mixins.Fragmentable, {
            initialize: function () {},
            fagments: {},
            registerEvents: function () {
                Fossil.Mixins.Events.registerEvents.call(this);
                this.listenTo(this, 'elementable:attach', _.bind(this.setup, this));
                this.listenTo(this, 'elementable:detach', _.bind(this.teardown, this));
            },
            setup: function () {
                this.trigger('setup', this);
            },
            teardown: function () {
                this.trigger('teardown', this);
            },
            render: function () {
                this.renderLayout();
                this.renderFragments();
                this.trigger('render');
                return this;
            },
            remove: function () {
                this.trigger('remove');
                this.removeFragments();
                this.removeLayout();
                return this;
            }
    });

    Fragment.extend = Backbone.Model.extend;

    return Fragment;
});
