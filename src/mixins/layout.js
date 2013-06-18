// the Layout mixin is used to extend a class with layout management.
// The class should also implment Event mixins.
//
// Define your layout in the `template` property of your object.
// A template can either be a `Backbone.View`, a `function` or a `string`.
// In any cse it will be transformed into a `Backbone.View` and stored into
// `layout` property.
define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {

    'use strict';

    var LayoutView = Backbone.View.extend({
        initialize: function (options) {
            this.template = options.template;
        },
        render: function () {
            this.$el.html(_.result(this.options, 'template'));
            return this;
        }
    });

    var Layout = Fossil.Mixins.Layout = {
        // use the template property to specify template.
        template: '',
        setupLayout: function ($el) {
            var layout = this.template;
            if (this.options && this.options.template) {
                layout = this.options.template;
            }
            // place layout property in the object.
            if (_.isFunction(layout) && !layout.prototype.render) {
                layout = layout.call(this);
            }
            if (typeof layout === 'string') {
                layout = new LayoutView({
                    template: layout
                });
            } else if (layout instanceof Backbone.View) {
                // nothing to do here
            } else if (layout.prototype.render) {
                layout = new layout();
            }
            this.layout = layout;
            this.layout.render();
            this.trigger('layout:setup', this, $el);
        },
        renderLayout: function ($el) {
            if (!this.layout) {
                this.setupLayout($el);
            }
            if ($el) {
                $el.append(this.layout.$el);
            }
            this.trigger('layout:render', this);
        },
        removeLayout: function () {
            this.layout.$el.detach();
            this.trigger('layout:remove', this);
        },
        $: function () {
            return this.layout.$.apply(this.layout, arguments);
        }
    };

    return Layout;
});
