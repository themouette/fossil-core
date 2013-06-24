define([
    "jquery",
    "fossil/core",
    "fossil/factory",
    "underscore",
    "backbone"
], function ($, Fossil, Factory, _, Backbone) {
    var Layout = Fossil.Factories.Layout = Factory.extend({
        options: {
            // selector the Application layout should be attached to.
            selector: '#main'
        },
        _doActivateApplication: function (application) {
            this.listenTo(application, 'setup:layout', _.bind(this.setupApplication, this, application), this);
            this.listenTo(application, 'teardown:layout', _.bind(this.teardownApplication, this, application), this);
        },
        _doSuspendApplication: function (application) {
            this.stopListening(application);
        },
        _doActivateModule: function (module, application) {
            this.listenTo(module, 'setup:layout', _.bind(this.setupModule, this, module, application), this);
            this.listenTo(module, 'teardown:layout', _.bind(this.teardownModule, this, module, application), this);
        },
        _doSuspendModule: function (module, application) {
            this.stopListening(module);
        },

        setupApplication: function (application) {
            application.trigger(this.prefixEvent('prerender'));
            this.processUnitLayout(application, $(this.options.selector));
            application.trigger(this.prefixEvent('render'));
        },
        teardownApplication: function (application) {
            application.trigger(this.prefixEvent('remove'));
        },
        setupModule: function (module, application) {
            module.trigger(this.prefixEvent('prerender'));
            this.processUnitLayout(module, $('[data-fossil-placeholder=module]', this.options.selector));
            module.trigger(this.prefixEvent('render'));
        },
        teardownModule: function (module, application) {
            module.trigger(this.prefixEvent('remove'));
        },
        processUnitLayout: function (unit, $el) {
            var content;
            var template = unit.template;
            if (template instanceof Backbone.View) {
                // in case unit template is a view
                content = template.render().$el;
            } else if (_.isFunction(template)) {
                // in case template is a function
                content = template();
            } else {
                // assume template is string
                content = template;
            }

            $el.empty().append(content);
        }
    });

    return Layout;
});
