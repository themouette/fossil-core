define([
    'fossil/core',
    'underscore',
    'backbone'
], function (Fossil, _, Backbone) {

    var messages = {
        unknown_module: _.template("Unknown module at \"<%- path %>\".")
    };

    var Application = Fossil.Application = function (options) {
        this.options = options || {};
        initEventListeners(this);
        initFactories(this);
        initModules(this);
        this.initialize.apply(this, arguments);
    };

    _.extend(Application.prototype, Backbone.Events, {
        initialize: function () {
        },

        // connect an module at given subpath
        connect: function (path, module) {
            if (_.isFunction(module)) {
                module = new module(this, path);
            }
            this.modules[path] = module;
            this.trigger('module:connect', module, path, this);

            return this;
        },
        // retreive an module from it's path
        // or returns all modules if no path is given.
        getModule: function (path) {
            if (typeof path === "undefined") {
                return this.modules;
            }
            if (this.modules[path]) {
                return this.modules[path];
            }

            throw new Error(messages.unknown_module({path: path}));
        },

        // use a factory
        use: function (id, factory) {
            if (_.isFunction(factory)) {
                factory = new factory();
            }
            // suspend previously registered factory with this name
            if (this.factories[id]) {
                this.factories[id].suspendApplication(this, id);
            }
            factory.activateApplication(this, id);
            this.factories[id] = factory;
            this.trigger('factory:use', factory, id, this);

            return this;
        },

        // expose application's PubSub to plug it in application.
        createPubSub: function () {
            var pubsub = {}, application = this;
            _.each(['on', 'off', 'trigger', 'once'], function (method) {
                pubsub[method] = _.bind(application[method], application);
            });

            return pubsub;
        },

        start: function () {
            this.trigger('setup');
            this.trigger('setup:layout');
            this.trigger('start');
        }
    });

    function initFactories (application) {
        var factories = _.extend(
            {},
            application.factories || {},
            application.options.factories || {}
        );
        application.factories = {};
        _.each(factories, function (factory, id) {
            application.use(id, factory);
        });
    }

    function initModules (application) {
        var apps = _.extend(
            {},
            application.modules || {},
            application.options.modules || {}
        );
        application.modules = {};
        _.each(apps, function (module, path) {
            application.connect(path, module);
        });
    }

    function initEventListeners (application) {
        var events = _.extend(
            {},
            _.result(application, 'events'),
            _.result(application.options, 'events')
        );
        _.each(events, function (callback, eventname) {
            if (!_.isFunction(callback)) {
                callback = application[callback];
            }
            if (callback) {
                application.listenTo(application, eventname, callback, application);
            }
        });
    }

    Application.extend = Backbone.Model.extend;

    return Application;
});
