// the Layout mixin is used to extend a class with layout management.
// The class should also implment Event mixins.
//
// Define your layout in the `template` property of your object.
// A template can either be a `Backbone.View`, a `function` or a `string`.
// In any case it will be transformed into a `Backbone.View` and stored into
// `layout` property.
Fossil.Mixins.Layoutable = (function (Fossil, _, Backbone) {
    'use strict';

    var LayoutView = Fossil.View;

    var Layoutable = {
        // use the template property to specify template.
        template: null,
        initLayoutable: function () {
            if (this.options && typeof(this.options.template) !== "undefined") {
                this.template = this.options.template;
            }
        },
        setupLayout: function (template) {
            this.layout = layoutAsString(this, template) ||
                          layoutAsMethod(this, template) ||
                          layoutAsDom(this, template) ||
                          layoutAsBackboneView(this, template) ||
                          layoutAsRenderable(this, template) ||
                          template;

            this.trigger('layout:setup', this);
        },
        renderLayout: function () {
            if (!this.layout) {
                this.setLayout(this.template, true);
            }
            this.attachLayout();
            if (this.renderView) {
                this.renderView(this.layout);
            } else {
                this.layout.render();
            }
            this.trigger('layout:render', this);
        },
        attachLayout: function () {
            this.layout.setElement(this.$el);
        },
        removeLayout: function () {
            this.layout.setElement(null);
            this.$el.empty();
            this.trigger('layout:remove', this);
        },
        // recycle means no rerender.
        setLayout: function(layout, recycle) {
            if (this.layout) {
                this.removeLayout();
                this.layout = null;
            }
            this.setupLayout(layout);
            if (recycle) {
                this.attachLayout();
            } else {
                this.renderLayout();
            }
            return this;
        }
    };

    function layoutAsString(layoutable, template) {
        if (typeof template !== 'string') {
            return false;
        }

        return new LayoutView({
            template: template
        });
    }

    function layoutAsMethod(layoutable, template) {
        if (typeof template !== 'function' || template.prototype.render) {
            return false;
        }

        return new LayoutView({
            template: template
        });
    }

    // remember to test for string before
    function layoutAsDom(layoutable, template) {
        if (template) {
            return false;
        }

        // use the html content
        return new LayoutView({
            template: layoutable.$el.html()
        });
    }

    function layoutAsBackboneView(layoutable, template) {
        if (template instanceof Backbone.View) {
            return template;
        }

        return false;
    }

    function layoutAsRenderable(layoutable, template) {
        if (typeof template !== 'function' || !template.prototype.render) {
            return false;
        }

        template = new template({});
        layoutable.$el.append(template.$el);
        return template;
    }

    return Layoutable;
})(Fossil, _, Backbone);
