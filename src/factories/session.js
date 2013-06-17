// Fossil.Factories.Session helps in sharing data between every layer
// this factory is exposed to modules as well as application.
//
// ```javascript
// new Fossil.Application({
//   factories: {
//     session: Fossil.Factories.Session
//   },
//   modules: {
//     '': Fossil.Module.extend({
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

    function requireApplicationError () {
        throw new Error();
    }
    var exposed = ['get', 'set', 'has'];

    var Session = Fossil.Factories.Session = Factory.extend({
        options: {
            exposeToModule: true,
            defaults: {}
        },
        _doActivateApplication: function(application, id) {
            var factory = this;

            this.model = new Backbone.Model(this.options.defaults || {});
            _.each(exposed, function (method) {
                factory[method] = _.bind(factory.model[method], factory.model);
            });
        },
        _doSuspendApplication: function(application, id) {
            var factory = this;

            this.model = null;
            _.each(exposed, function (method) {
                factory[method] = requireApplicationError;
            });
        }
    });

    _.each(exposed, function (method) {
        Session.prototype[method] = requireApplicationError;
    });

    return Session;
});
