define([
    'underscore', 'backbone', '../mixin', '../mixins/observable', '../mixins/deferrable', '../mixins/startable'
], function (_, Backbone, Mixin, Observable, Deferrable, Startable) {
  "use strict";

    var ViewExtension = {
        // if `template` is a string, it will be processed through Handlebars.
        // otherwise it leaves it untouched.
        precompile: function (template) {
            if (typeof template === "string") {
                return _.template(template);
            }
            return template;
        },
        // allow an extra helper parameter to view render, as defaults for
        // template data.
        //
        // This is desined to be used with the engine `render()`
        // method.
        renderHtml: function (data, extra) {
            return this.template(_.defaults(data, extra));
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
            var engine = this.engine;
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
            var extraTpl, extra;

            // emulate handlebars style extra data for template helpers.
            extraTpl = {
                // extra helpers to use for this context
                helpers: helpers,
                // add global available data
                data: data
            };

            // wrap helpers sot it receives the extra data.
            _.each(helpers || {}, function (helper, key) {
                helpers[key] = function () {
                    return helper.apply(this, _.toArray(arguments).concat([extraTpl]));
                };
            });

            // data to be passed to
            extra = _.extend(
                {},
                // extra helpers to use for this context
                helpers || {},
                // add global available data
                data || {}
            );

            return view.render(extra);
        }
    });

    Engine.mix([Observable, Deferrable, Startable]);

    return Engine;
});
