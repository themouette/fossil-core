// Fossil.Factories.Session helps in sharing data between every layer
// this factory is exposed to applications as well as project.
//
// ```javascript
// new Fossil.Project({
//   factories: {
//     session: Fossil.Factories.Session
//   },
//   applications: {
//     '': Fossil.Application.extend({
//         foo: function () {
//             this.factories.session.get('user');
//         }
//     })
//   }
// });
// ```
define([
    "fossil/core",
    "underscore",
    "backbone",
    "fossil/factory"
], function (Fossil, _, Backbone, Factory) {

    function requireProjectError () {
        throw new Error();
    }
    var exposed = ['get', 'set', 'has'];

    var Session = Fossil.Factories.Session = Factory.extend({
        options: {
            exposeToApplication: true,
            defaults: {}
        },
        _doActivateProject: function(project, id) {
            var factory = this;

            this.model = new Backbone.Model(this.options.defaults || {});
            _.each(exposed, function (method) {
                factory[method] = _.bind(factory.model[method], factory.model);
            });
        },
        _doSuspendProject: function(project, id) {
            var factory = this;

            this.model = null;
            _.each(exposed, function (method) {
                factory[method] = requireProjectError;
            });
        }
    });

    _.each(exposed, function (method) {
        Session.prototype[method] = requireProjectError;
    });

    return Session;
});
