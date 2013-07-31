Fossil.Application = (function (Fossil, $, _, Backbone) {
    'use strict';

    var messages = {
        unknown_module: _.template("Unknown module at \"<%- path %>\".")
    };

    var Application = function (options) {
        this.options = options || {};
        this.registerEvents();
        initServices(this);
        // init fragmentable
        this.initLayoutable();
        this.initFragmentable();
        initModules(this);
        this.initialize.apply(this, arguments);
    };

    _.extend(Application.prototype,
        Fossil.Mixins.Observable,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layoutable,
        Fossil.Mixins.Fragmentable,
        Fossil.Mixins.Deferrable,
        Fossil.Mixins.Startable, {
            // default selector for application to append to.
            selector: 'body',
            currentModule: null,
            template: '<div data-fossil-placeholder="module"></div>',
            initialize: function () {
            },

            // connect an module at given subpath
            connect: function (id, module) {
                if (_.isFunction(module)) {
                    module = new module();
                }
                this.modules[id] = module;
                // trigger connect on module
                if (module.trigger) {
                    module.trigger('connect', this, id);
                }
                // then on application
                this.trigger('module:connect', module, id, this);

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

            // use a service
            use: function (id, service) {
                if (_.isFunction(service)) {
                    service = new service();
                }
                // suspend previously registered service with this name
                if (this.services[id]) {
                    this.services[id].suspendApplication(this, id);
                }
                service.activateApplication(this, id);
                this.services[id] = service;
                this.trigger('service:use', service, id, this);

                return this;
            },

            _doStart: function () {
                this.setElement($(this.selector));
                this.renderLayout();
                this.renderFragments();
                Fossil.Mixins.Startable._doStart.apply(this, arguments);
            },

            switchModule: function (module) {
                var moduleChange = (this.currentModule !== module);
                if (moduleChange && this.currentModule) {
                    this.trigger('module:standby', this.currentModule);
                    this.currentModule.detachElement();
                }
                if (moduleChange) {
                    var $el = this.$('[data-fossil-placeholder=module]');
                    this.trigger('module:change', this.currentModule, module);
                    module.setElement($el);
                    module.thenWith(this, function moduleReady () {
                        this.trigger('module:start', module);
                        this.currentModule = module;
                    });
                }
            }
    });

    function initServices (application) {
        var services = _.extend(
            {},
            application.services || {},
            application.options.services || {}
        );
        application.services = {};
        _.each(services, function (service, id) {
            application.use(id, service);
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

    Application.extend = Backbone.Model.extend;

    return Application;
})(Fossil, $, _, Backbone);
