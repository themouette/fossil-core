Fossil.View = (function (_, Backbone, Fossil) {
    var View = Backbone.View.extend({
        constructor: function (options) {
            Backbone.View.apply(this, arguments);
            if (options && typeof options.template !== "undefined") {
                this.template = options.template;
            }
        },
        render: function (helpers) {
            var data, renderedHtml;
            if (this.precompile) {
                this.template = this.precompile(this.template);
            }
            data = {};
            if (this.getViewData) {
                data = this.getViewData();
            }
            renderedHtml = this.template;
            if (this.renderHtml) {
                renderedHtml = this.renderHtml.apply(this, [data].concat(_.toArray(arguments)));
            }
            this.$el.html(renderedHtml);
            return this;
        }
    });

    return View;
})(_, Backbone, Fossil);
