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
        // usually container is the Fragmentable
        // but in case of Fragment, the Module or Application
        // should be used as container.
        // This ease communication.
        getFragmentContainer: function () {
            return this;
        },
        // ensure Fragment is instanciated
        ensureFragment: function(id) {
            var fragment = this.fragments[id];
            if (!fragment) {
                throw new Error(messages.unknown_fragment({id: fragmentid}));
            }
            if (fragment.ensureFragment) {
                // fragment is already instanciated
                return fragment;
            }
            // instanciate fragment
            fragment = new fragment(this.getFragmentContainer());
            this.trigger('fragmentable:fragment:setup', fragment, id, this);
            return fragment;
        },
        // setup all the fragments.
        // all available fragments are instanciated if not already
        // and attached to the DOM elements.
        renderFragments: function () {
            var fragmentable = this;
            this.$('[data-fossil-fragment]').each(function (index, el) {
                var id = el.getAttribute('data-fossil-fragment');
                fragmentable.renderFragment(id, fragmentable.$(el));
            });
            this.trigger('fragmentable:render', this);
        },
        // setup a single fragment
        renderFragment: function (fragmentid, $el) {
            var fragment = this.ensureFragment(fragmentid);
            fragment.setElement($el);
            fragment.render();
            this.trigger('fragmentable:fragment:render', fragment, fragmentid, this);
        },
        // teardown all the fragments
        removeFragments: function () {
            var fragmentable = this;
            this.$('[data-fossil-fragment]').each(function (index, el) {
                var id = el.getAttribute('data-fossil-fragment');
                fragmentable.removeFragment(id);
            });
            this.trigger('fragmentable:remove', this);
        },
        // element is detached.
        removeFragment: function (fragmentid) {
            var fragment = this.fragments[fragmentid];
            if (!fragment || !fragment.$el) {
                return ;
            }
            fragment.detachElement();
            this.trigger('fragmentable:fragment:remove', fragment, fragmentid, this);
        }
    };

    return Fragmentable;
});
