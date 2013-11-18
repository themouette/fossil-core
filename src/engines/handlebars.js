define([
    'underscore', 'backbone', 'handlebars', '../mixin', '../mixins/observable', '../mixins/deferrable', '../mixins/startable'
], function (_, Backbone, Handlebars, Mixin, Observable, Deferrable, Startable) {
  "use strict";

    var ViewExtension = {
        // if `template` is a string, it will be processed through Handlebars.
        // otherwise it leaves it untouched.
        precompile: function (template) {
            if (typeof template === "string") {
                return Handlebars.compile(template);
            }
            return template;
        },
        // allow an extra helper parameter to view render
        // this is the handlebars extra data. Learn more at
        // http://handlebarsjs.com/execution.html#Options
        //
        // This is desined to be used with the engine `render()`
        // method.
        renderHtml: function (data, extra) {
            return this.template(data, extra);
        }
    };

    var Engine = Mixin.extend({
        // extends Backbone.View prototype
        _firstStart: function () {
            _.defaults(Backbone.View.prototype, ViewExtension);
            Startable._firstStart.apply(this, arguments);
        },

        // removes Backbone.View prototype engine functions.
        _doStop: function () {
            _.each(ViewExtension, function unmix(method, name) {
                if (Backbone.View.prototype[name] === method) {
                    Backbone.View.prototype[name] = null;
                }
            });
        },

        // render a view and format all required extra data for template
        // engine in use.
        //
        // View has been extended to accept formatted Handlebars extra data.
        // learn more at http://handlebarsjs.com/execution.html#Options
        render: function (view, helpers, data) {
            var extra = {
                // extra helpers to use for this context
                helpers: helpers,
                // add global available data
                data: data
            };

            return view.render(extra);
        }
    });

    Engine.mix([Observable, Deferrable, Startable]);

    return Engine;
});
