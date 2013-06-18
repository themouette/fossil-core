// fragmentable mixin allow to define fragments in a layout object.
define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {
    var messages = {
        unknown_fragment: _.template('No fragment available for "<%= id %>".')
    };
    var Fragmentable = Fossil.Mixins.Fragmentable = {
        // list all fragments
        fragments: {},
        initFragmentable: function () {
        },
        setupFragment: function (fragmentid) {
            var fragment = this.fragments[fragmentid];
            if (!fragment) {
                throw new Error(messages.unknown_fragment({id: fragmentid}));
            }
            // is the fragment already instanciated ?
            if (fragment.render) {
                return fragment;
            }
            fragment = new this.fragments[fragmentid](this);
            this.fragments[fragmentid] = fragment;
            this.trigger('fragmentable:setup');
            return fragment;
        },
        renderFragments: function ($el) {
            var fragmentable = this;
            $el.find('[data-fossil-fragment]').each(function (index, el) {
                var $fragment = $el.find(el);
                var id = el.getAttribute('data-fossil-fragment');
                var fragment = fragmentable.setupFragment(id);
                fragment.render($fragment);
            });
            this.trigger('fragmentable:render');
        },
        removeFragments: function () {
            var fragmentable = this;
            this.$('[data-fossil-fragment]').each(function (index, el) {
                var id = el.getAttribute('data-fossil-fragment');
                var fragment = fragmentable.setupFragment(id);
                fragment.remove();
            });
            this.trigger('fragmentable:remove');
        }
    };

    return Fragmentable;
});
