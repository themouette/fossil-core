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

    // patch Fossil.View
    _.extend(Fossil.View.prototype, {
        renderHtml: function (data, helpers) {
            return this.template(data, helpers);
        },
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
        // expose view manager methods
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
        // exposed to the component
        // set the component current view.
        // * recycle view is not rerendered
        setView: function (component, view, recycle) {
            if (component.selectView) {
                component.selectView(view);
            }
            component.setLayout(view, recycle);
        },
        // render a view
        renderView: function (component, view) {
            var extra = {
                helpers: this.getHelpers(component),
                data: this.getExtraData(component, view)
            };
            view.render(extra);
        },
        getHelpers: function (component) {
            return component.helpers || {};
        },
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
