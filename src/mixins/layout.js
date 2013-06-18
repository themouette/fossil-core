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
        template: null,
        setupLayout: function () {
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
                    el: this.$el,
                    template: layout
                });
            } else if (!layout) {
                // use the html content
                layout = new LayoutView({
                    el: this.$el,
                    template: this.$el.html()
                });
            } else if (layout instanceof Backbone.View) {
                this.$el.append(layout.$el);
            } else if (layout.prototype.render) {
                layout = new layout({});
                this.$el.append(layout.$el);
            }
            this.layout = layout;
            this.trigger('layout:setup', this);
        },
        renderLayout: function () {
            if (!this.layout) {
                this.setupLayout();
            }
            this.layout.render();
            this.trigger('layout:render', this);
        },
        removeLayout: function () {
            if (this.layout && this.layout.$el[0] !== this.$el[0]) {
                this.layout.remove();
            } else {
                this.layout.undelegateEvents();
            }
            this.trigger('layout:remove', this);
        }
    };

    return Layout;
});
