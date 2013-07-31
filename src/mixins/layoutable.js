// the Layout mixin is used to extend a class with layout management.
// The class should also implment Event mixins.
//
// Define your layout in the `template` property of your object.
// A template can either be a `Backbone.View`, a `function` or a `string`.
// In any case it will be transformed into a `Backbone.View` and stored into
// `layout` property.
Fossil.Mixins.Layoutable = (function (Fossil, _, Backbone) {
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

    var Layoutable = {
        // use the template property to specify template.
        template: null,
        initLayoutable: function () {
            if (this.options && typeof(this.options.template) !== "undefined") {
                this.template = this.options.template;
            }
        },
        setupLayout: function (template) {
            var layout = layoutResult(this, template);

            this.layout = layoutAsString(this, layout) ||
                          layoutAsDom(this, layout) ||
                          layoutAsBackboneView(this, layout) ||
                          layoutAsRenderable(this, layout);

            this.trigger('layout:setup', this);
        },
        renderLayout: function () {
            if (!this.layout) {
                this.setupLayout(this.template);
            }
            this.layout.render();
            this.trigger('layout:render', this);
        },
        removeLayout: function () {
            if (this.layout && this.layout.$el[0] !== this.$el[0]) {
                console.log("remove");
                this.layout.remove();
            } else if(this.layout.setElement) {
                this.layout.setElement(null);
            }
            this.$el.empty();
            this.trigger('layout:remove', this);
        },
        setLayout: function(layout) {
            if (this.layout) {
                this.removeLayout();
                this.layout = null;
            }
            this.setupLayout(layout);
            this.renderLayout();
            return this;
        }
    };

    // preapare template property.
    function layoutResult(layoutable, template) {
        // this is a function, not a renderable
        if (_.isFunction(template) && !template.prototype.render) {
            return template.call(layoutable);
        }
        return template;
    }

    function layoutAsString(layoutable, template) {
        if (typeof template !== 'string') {
            return false;
        }

        return new LayoutView({
            el: layoutable.$el,
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
            el: layoutable.$el,
            template: layoutable.$el.html()
        });
    }

    function layoutAsBackboneView(layoutable, template) {
        if (template instanceof Backbone.View) {
            layoutable.$el.append(template.$el);
            return template;
        }

        return false;
    }

    function layoutAsRenderable(layoutable, template) {
        if (!template.prototype.render) {
            return false;
        }

        template = new template({});
        layoutable.$el.append(template.$el);
        return template;
    }

    return Layoutable;
})(Fossil, _, Backbone);
