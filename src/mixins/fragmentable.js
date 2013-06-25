// fragmentable mixin allow to define fragments in a layout object.
define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {
    var Fragmentable = Fossil.Mixins.Fragmentable = {
        // list all fragments
        fragments: {},
        initFragmentable: function () {
            this.listenTo(this, 'layout:render', this.renderFragments, this);
            this.listenTo(this, 'layout:remove', this.removeFragments, this);
        },
        setupFragment: function (fragmentid) {
            var fragment = this.fragments[fragmentid];
            // is the fragment already instanciated ?
            if (fragment.render) {
                return fragment;
            }
            fragment = new this.fragments[fragmentid](this);
            this.fragments[fragmentid] = fragment;
            fragment.render();
            this.trigger('fragmentable:setup');
            return fragment;
        },
        renderFragments: function () {
            var fragmentable = this;
            this.$('[data-fossil-fragment]').each(function (index, el) {
                var id = el.getAttribute('data-fossil-fragment');
                var fragment = fragmentable.setupFragment(id);
                fragmentable.$(el).append(fragment.$el);
            });
            this.trigger('fragmentable:render');
        },
        removeFragments: function () {
            var fragmentable = this;
            this.$('[data-fossil-fragment]').each(function (index, el) {
                var id = el.getAttribute('data-fossil-fragment');
                var fragment = fragmentable.setupFragment(id);
                fragment.$el.detach();
            });
            this.trigger('fragmentable:remove');
        }
    };

    return Fragmentable;
});
