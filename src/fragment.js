Fossil.Fragment = (function (Fossil) {

    var Fragment = function (ancestor, options) {
        this.options = options || {};
        this.services = {};
        this.path = ancestor.path || '';
        this.ancestor = ancestor.createPubSub(this, 'ancestorEvents');
        this.registerEvents();
        this.initFragmentable();
        this.initialize.apply(this, arguments);
    };
    _.extend(Fragment.prototype,
        Fossil.Mixins.Observable,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layoutable,
        Fossil.Mixins.Fragmentable,
        Fossil.Mixins.Deferrable,
        Fossil.Mixins.Startable, {
            initialize: function () {},
            fagments: {},
            // usually container is the Fragmentable
            // but in case of Fragment, the Module or Application
            // should be used as container.
            // This ease communication.
            getFragmentAncestor: function () {
                return this.ancestor;
            },
            registerEvents: function () {
                Fossil.Mixins.Observable.registerEvents.call(this);
                this.listenTo(this, 'elementable:attach', _.bind(this.start, this));
                this.listenTo(this, 'elementable:detach', _.bind(this.standby, this));

                this.listenTo(this.ancestor, 'standby', _.bind(this.standby, this));
                this.listenTo(this.ancestor, 'stop', _.bind(this.stop, this));
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
})(Fossil);
