// Fossil.Services.Handlebars helps in sharing data between every layer
// this service is exposed to modules as well as application.
//
// ```javascript
// new Fossil.Application({
//   services: {
//     template: new Fossil.Services.Handlebars({ link: true })
//   },
//   modules: {
//     '': Fossil.Module.extend({
//       foo: function () {
//         var tpl = this.template.compile('');
//         var data = {}
//         this.template.render(tpl, data);
//       }
//     })
//   }
// });
// ```
Fossil.Services.Handlebars = (function (Fossil, _, Backbone, Handlebars, Helpers) {
    'use strict';

    var messages = {
        'router_required': 'router option is required'
    };

    // patch Fossil.View
    _.extend(Fossil.View.prototype, {
        // default view behavior is to render `template` property.
        renderHtml: function (data, helpers) {
            return this.template(data, helpers);
        },
        // if `template` is a string, it will be processed through Handlebars.
        // otherwise it leaces it untouched.
        precompile: function (template) {
            if (typeof template === "string") {
                return Handlebars.compile(template);
            }
            return template;
        }
    });


    // list of view manager methods to expose
    var managerMethods = [];
    // service methods to expose, component is the first argument
    var serviceMethods = ['setView', 'renderView'];
    var _super = Fossil.Service.prototype;
    var ViewHandler = Fossil.Service.extend({
        // identify the ViewHandler uses Handlebars engine.
        // it can be useful to register helpers
        engine: 'handlebars',
        initialize: function (options) {
            // router option is required
            // as it is used for `url` helper.
            if (!options.router) { throw new Error(messages.router_required); }
        },
        // expose view manager methods to components
        //
        // every component will access method as `component.methodName(viewManager)`
        // For instance `setView` and `renderView`
        doExpose: function (component, id) {
            var service = this;

            _.each(serviceMethods, function (method) {
                component[method] = _.bind(service[method], service, component);
            });

            _super.doExpose.apply(this, arguments);
        },
        // unexpose view manager methods
        undoExpose: function (component, id) {
            var service = this;

            _.each(managerMethods, function (method) {
                component[method] = null;
            });

            _super.undoExpose.apply(this, arguments);
        },
        // **exposed to the component**
        //
        // set the component's current view and renders it, unless it is told to `recycle`.
        setView: function (component, view, recycle) {
            this.attachView(component, view);
            if (!recycle) {
                component.renderView(view);
            }
        },
        attachView: function (component, view) {
            component.removeLayout();
            if (this.currentView) {
                this.currentView.$el.detach();
            }
            this.currentView = view;
            component.$el.append(view.$el);
        },
        // render a view
        // It provides handlebars `extra` to view render method.
        // This is the way helpers and global data are injected.
        renderView: function (component, view) {
            var extra = {
                helpers: this.getHelpers(component),
                data: this.getExtraData(component, view)
            };
            view.render(extra);
        },
        // Component helpers are stored in it's `helpers` property.
        getHelpers: function (component) {
            return component.helpers || {};
        },
        // some data to inject to handlebars
        getExtraData: function (component, view) {
            return {
                view: view,
                component: component
            };
        },

        // activate service on application.
        // this method has to be overriden with the service logic.
        _doActivateApplication: function (application) {
            application.helpers = _.extend(application.helpers || {}, this.createHelpersFor(application));
        },
        // activate service on module.
        // this method has to be overriden with the service logic.
        _doActivateModule: function (module, application) {
            module.helpers = _.extend(
                {},
                application.helpers || {},
                module.helpers || {},
                this.createHelpersFor(module)
            );
        },
        // activate service on fragment.
        // this method has to be overriden with the service logic.
        _doActivateFragment: function (fragment, parent) {
            fragment.helpers = _.extend(
                {},
                parent.helpers || {},
                this.createHelpersFor(fragment)
            );
        },
        // creates the helpers for components
        createHelpersFor: function (component) {
            var helpers = {
                // generate URL
                // it should rely on routing implementation
                // but for now it does the job.
                url: function () {
                    var parts = _.initial(arguments) || [];
                    var extra = _.tail(arguments);
                    if (component.path) {
                        parts.unshift(component.path);
                    }
                    parts.unshift('#');
                    return parts.join('');
                }
            };
            return helpers;
        }
    });

    return ViewHandler;
})(Fossil, _, Backbone, Handlebars);
