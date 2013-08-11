var Fossil = (function (_, Backbone, jQuery) {
// This file defines the Fossil base component.
// It is required for any of the Fossil component.
var Fossil = (function (root) {
    "use strict";

    root.Fossil || (root.Fossil = {});
    root.Fossil.Mixins || (root.Fossil.Mixins = {});

    return root.Fossil;
})(this);

Fossil.Deferred = (function ($) {
    return $.Deferred;
})(jQuery);

Fossil.View = (function (_, Backbone, Fossil) {
    var View = Backbone.View.extend({
        constructor: function (options) {
            Backbone.View.apply(this, arguments);
            if (options && typeof options.template !== "undefined") {
                this.template = options.template;
            }
        },
        render: function (helpers) {
            var data, renderedHtml, args = _.toArray(arguments);
            if (this.precompile) {
                this.template = this.precompile(this.template);
            }
            data = {};
            if (this.getViewData) {
                data = this.getViewData();
            }
            renderedHtml = this.template;
            if (this.renderHtml) {
                renderedHtml = this.renderHtml.apply(this, [data].concat(args));
            }
            this.$el.html(renderedHtml);
            return this;
        }
    });

    return View;
})(_, Backbone, Fossil);

Fossil.Mixins.Deferrable = (function (_, Fossil, Deferred) {
    'use strict';

    var messages = {
        timeout: 'async process timed out',
        rejected: 'some asynchronous process failed',
        missing_method: function (method) {
            _.template('Promise has no `<%= method %>` method.', {method: method});
        }
    };
    var uuidCounter = 0;

    var Deferrable = {
        waitFor: function (promise, options) {
            if (!this.isWaiting()) {
                this.async = new Wait();
                this.async.onStop = _.bind(function () {
                    this.async = null;
                }, this);
            }
            this.async.enqueue(promise, options);

            return this;
        },
        then: function (success, error, always) {
            if (!this.isWaiting()) {
                if (success) { success(); }
                if (always) { always(); }
                return this;
            }
            this.async.then(success, error, always);

            return this;
        },
        thenWith: function (context, success, error, always) {
            return this.then(
                success ? _.bind(success, context) : success,
                error ? _.bind(error, context) : error,
                always ? _.bind(always, context) : always
            );
        },
        abort: function () {
            if (this.isWaiting()) {
                this.async.abort();
            }
            return this;
        },
        isWaiting: function () {
            return  !!this.async &&
                    !!this.async.deferred &&
                    "pending" === this.async.deferred.state();
        }
    };

    function clearDeferrable(deferrable) {
        deferrable.async = null;
    }

    function Wait() {
        // the deferred to handle queues
        this.deferred = new Deferred();
        // keep a track of all promises
        this.promises = [];
        // a unique id
        this.uuid = uuidCounter++;
        // timeouts
        this.timeouts = [];
    }

    _.extend(Wait.prototype, {
        enqueue: function (promise, options) {
            options = this.ensureOptions(options);
            // tatoo the promise
            promise.deferrableUuid = this.uuid;
            // add promise to list
            this.promises.push(promise);
            // register callbacks
            if (options.timeout) {
                this.addTimeout(promise, options.timeout);
            }
            if (options.failFast) {
                this.addFailFast(promise);
            } else {
                this.addFailSilently(promise);
            }
        },
        then: function (success, error, always) {
            if (success) {
                this.deferred.done(success);
            }
            if (error) {
                this.deferred.fail(error);
            }
            if (always) {
                this.deferred.always(always);
            }
        },
        ensureOptions: function (options) {
            return _.extend({
                failFast: true,
                timeout: false
            }, options || {});
        },
        addTimeout: function (promise, timeout) {
            if (!promise.always) {
                throw new Error(messages.missing_method('always'));
            }
            var timer = setTimeout(function () {
                promise.reject(messages.timeout);
            }, timeout);
            promise.always(function () {
                if (timer) {
                    clearTimeout(timer);
                }
            });

            this.timeouts.push(timer);
        },
        addFailSilently: function (promise) {
            if (!promise.always) {
                throw new Error(messages.missing_method('always'));
            }
            promise.always(_.bind(this.onAlways, this, promise));
        },
        addFailFast: function (promise) {
            if (!promise.done) {
                throw new Error(messages.missing_method('done'));
            }
            promise.done(_.bind(this.onDone, this, promise));
            if (!promise.fail) {
                throw new Error(messages.missing_method('fail'));
            }
            promise.fail(_.bind(this.onFail, this, promise));
        },
        // failfast only
        onDone: function (promise) {
            if (!this.isValidPromise(promise)) {return ;}
            this.processAsyncReturn(promise);
        },
        // failfast only
        onFail: function (promise, error) {
            if (!this.isValidPromise(promise)) {return ;}
            this.reject(error);
        },
        // failsilently only
        onAlways: function (promise) {
            if (!this.isValidPromise(promise)) {return ;}
            this.processAsyncReturn(promise);
        },
        reject: function (error) {
            this.deferred.reject(error);
            this.deferred.reject.apply(this.deferred, [error].concat(this.promises));
            this.stop();
        },
        processAsyncReturn: function () {
            // are all the promises processed ?
            var processed = _.every(this.promises, function (p) {
                return "pending" !== p.state();
            });
            if (!processed) { return this; }

            // has there been a failure ?
            var failed = _.any(this.promises, function (p) {
                return "resolved" !== p.state();
            });

            if (failed) {
                // default fail behavior.
                return this.reject(messages.rejected);
            }

            this.deferred.resolve.apply(this.deferred, this.promises);
            this.stop();
        },
        isValidPromise: function (promise) {
            return this.uuid === promise.deferrableUuid;
        },
        abort: function (message) {
            _.each(this.promises, function (promise) {
                if (promise.abort && _.isFunction(promise.abort)) {
                    promise.abort();
                }
            });
            return this.reject(message || messages.aborted);
        },
        stop: function () {
            // ensure the promises coming backe are not processed
            this.uuid = null;
            // clear all timeouts
            _.each(this.timeouts, function (timeout) {
                if (timeout) {
                    clearTimeout(timeout);
                }
            });
            this.onStop();
        }
    });

    return Deferrable;
})(_, Fossil, Fossil.Deferred);

Fossil.Mixins.Elementable = (function ($, Fossil) {
    'use strict';

    var messages = {
        not_initialized: 'The Elementable element is not initialized. Call setElement first.'
    };
    var Elementable = {
        // set the fragment root element.
        // if no template was set, then the element HTML is used.
        setElement: function (el) {
            if (this.$el) {
                this.detachElement();
            }
            this.$el = $(el);
            this.trigger('elementable:attach', this);
            return this;
        },
        // up to now, nothing is done here.
        // when element is changed or detached, this method is and must be called.
        detachElement: function () {
            this.trigger('elementable:detach', this);
            this.$el = null;
        },
        $: function () {
            if (!this.$el) {
                throw new Error(messages.not_initialized);
            }
            return this.$el.find.apply(this.$el, arguments);
        }
    };

    return Elementable;
})(jQuery, Fossil);

// fragmentable mixin allow to define fragments in a layout object.
Fossil.Mixins.Fragmentable = (function (Fossil, _, Backbone) {
    'use strict';

    var messages = {
        unknown_fragment: _.template('No fragment available for "<%= id %>".')
    };

    var Fragmentable = {
        // list all fragments
        fragments: {},
        initFragmentable: function () {
            if (this.options.fragments) {
                this.fragments = _.extend(this.fragments, this.options.fragments);
            }
        },
        // usually container is the Fragmentable
        // but in case of Fragment, the Module or Application
        // should be used as container.
        // This ease communication.
        getFragmentAncestor: function () {
            return this;
        },
        // ensure Fragment is instanciated
        ensureFragment: function(id) {
            var fragment = this.fragments[id];
            if (!fragment) {
                throw new Error(messages.unknown_fragment({id: id}));
            }
            if (typeof fragment === "object") {
                // fragment is already instanciated
                return fragment;
            }
            // instanciate fragment
            fragment = new fragment(this.getFragmentAncestor());
            this.trigger('fragmentable:fragment:setup', fragment, id, this);
            return fragment;
        },
        // setup all the fragments.
        // all available fragments are instanciated if not already
        // and attached to the DOM elements.
        renderFragments: function () {
            var fragmentable = this;
            this.$('[data-fossil-fragment]').each(function (index, el) {
                var id = el.getAttribute('data-fossil-fragment');
                fragmentable.renderFragment(id, fragmentable.$(el));
            });
            this.trigger('fragmentable:render', this);
        },
        // setup a single fragment
        renderFragment: function (fragmentid, $el) {
            var fragment = this.ensureFragment(fragmentid);
            fragment.setElement($el);
            fragment.render();
            this.trigger('fragmentable:fragment:render', fragment, fragmentid, this);
        },
        // teardown all the fragments
        removeFragments: function () {
            var fragmentable = this;
            this.$('[data-fossil-fragment]').each(function (index, el) {
                var id = el.getAttribute('data-fossil-fragment');
                fragmentable.removeFragment(id);
            });
            this.trigger('fragmentable:remove', this);
        },
        // element is detached.
        removeFragment: function (fragmentid) {
            var fragment = this.fragments[fragmentid];
            if (!fragment || !fragment.$el) {
                return ;
            }
            fragment.detachElement();
            this.trigger('fragmentable:fragment:remove', fragment, fragmentid, this);
        }
    };

    return Fragmentable;
})(Fossil, _, Backbone);

// the Layout mixin is used to extend a class with layout management.
// The class should also implment Event mixins.
//
// Define your layout in the `template` property of your object.
// A template can either be a `Backbone.View`, a `function` or a `string`.
// In any case it will be transformed into a `Backbone.View` and stored into
// `layout` property.
Fossil.Mixins.Layoutable = (function (Fossil, _, Backbone) {
    'use strict';

    var LayoutView = Fossil.View;

    var Layoutable = {
        // use the template property to specify template.
        template: null,
        initLayoutable: function () {
            if (this.options && typeof(this.options.template) !== "undefined") {
                this.template = this.options.template;
            }
        },
        setupLayout: function (template) {
            this.layout = layoutAsString(this, template) ||
                          layoutAsMethod(this, template) ||
                          layoutAsDom(this, template) ||
                          layoutAsBackboneView(this, template) ||
                          layoutAsRenderable(this, template) ||
                          template;

            this.trigger('layout:setup', this);
        },
        renderLayout: function () {
            if (!this.layout) {
                this.setLayout(this.template, true);
            }
            this.attachLayout();
            if (this.renderView) {
                this.renderView(this.layout);
            } else {
                this.layout.render();
            }
            this.trigger('layout:render', this);
        },
        attachLayout: function () {
            this.layout.setElement(this.$el);
        },
        removeLayout: function () {
            this.layout.setElement(null);
            this.$el.empty();
            this.trigger('layout:remove', this);
        },
        // recycle means no rerender.
        setLayout: function(layout, recycle) {
            if (this.layout) {
                this.removeLayout();
                this.layout = null;
            }
            this.setupLayout(layout);
            if (recycle) {
                this.attachLayout();
            } else {
                this.renderLayout();
            }
            return this;
        }
    };

    function layoutAsString(layoutable, template) {
        if (typeof template !== 'string') {
            return false;
        }

        return new LayoutView({
            template: template
        });
    }

    function layoutAsMethod(layoutable, template) {
        if (typeof template !== 'function' || template.prototype.render) {
            return false;
        }

        return new LayoutView({
            template: template
        });
    }

    // remember to test for string before
    function layoutAsDom(layoutable, template) {
        if (template) {
            return false;
        }

        // use the html content
        return new LayoutView({
            template: layoutable.$el.html()
        });
    }

    function layoutAsBackboneView(layoutable, template) {
        if (template instanceof Backbone.View) {
            return template;
        }

        return false;
    }

    function layoutAsRenderable(layoutable, template) {
        if (typeof template !== 'function' || !template.prototype.render) {
            return false;
        }

        template = new template({});
        layoutable.$el.append(template.$el);
        return template;
    }

    return Layoutable;
})(Fossil, _, Backbone);

Fossil.Mixins.Observable = (function (Fossil, _, Backbone) {
    'use strict';

    var exposedPubsubProperties = ['_listenerId', 'createPubSub'].concat(_.keys(Backbone.Events));

    var Eventable = _.extend({}, Backbone.Events, {
        registerEvents: function () {
            var events = _.extend(
                {},
                _.result(this, 'events'),
                _.result(this.options || {}, 'events')
            );
            var observable = this;

            _.each(events, function (method, eventid) {
                // create callback from method
                // if it is not a function already, it should be a method
                if (!_.isFunction(method)) {
                    method = observable[method];
                }
                observable.listenTo(observable, eventid, _.bind(method, observable));
            });
        },

        // expose application's PubSub to plug it in application.
        createPubSub: function (observer, property) {
            var pubsub = {}, observable = this;
            _.each(exposedPubsubProperties, function (property) {
                if (_.isFunction(observable[property])) {
                    pubsub[property] = _.bind(observable[property], observable);
                } else {
                    pubsub[property] = observable[property];
                }
            });

            // in case there is no observer
            if (!observer) {return pubsub;}

            var events = _.extend(
                {},
                _.result(observer, property),
                _.result(observer.options || {}, property)
            );

            _.each(events, function (method, eventid) {
                // create callback from method
                // if it is not a function already, it should be a method
                if (!_.isFunction(method)) {
                    method = observer[method];
                }
                observable.listenTo(observable, eventid, _.bind(method, observer));
            });

            return pubsub;
        }
    });

    return Eventable;
})(Fossil, _, Backbone);

Fossil.Mixins.Startable = (function (Fossil) {
    'use strict';

    var messages = {
    };

    // This mixin requires Fossil.Mixins.Deferrable
    // It gives an object the ability to start, standby and stop.
    var Startable = {
        run: false,
        start: function () {
            if (this.run) {
                return false;
            }
            if (!this._firstStarted) {
                this._firstStart();
                this._firstStarted = true;
            }
            this.thenWith(this, this._doStart, this._startError);
        },
        standby: function () {
            if (!this.run) {
                return false;
            }
            this._doStandby();
        },
        stop: function () {
            if (!this._firstStarted) {
                return false;
            }
            this.standby();
            this.thenWith(this, this._doStop, this._stopError);
        },

        // Start being asynchronous, use this
        // callback to catch start errors.
        // when an error occurs, _doStart is not called,
        // this method is called instead.
        _startError: function (error) {
            throw error;
        },
        // Stop being asynchronous, use this
        // callback to catch stop errors.
        // When an error occurs, _doStop is not called,
        // this method is called instead.
        _stopError: function (error) {
            throw error;
        },

        _firstStart: function () {
            this.trigger('start:first', this);
        },
        _doStart: function () {
            this.trigger('start', this);
            this.run = true;
        },
        _doStandby: function () {
            this.trigger('standby', this);
            this.run = false;
        },
        _doStop: function () {
            this._firstStarted = false;
            this.trigger('stop', this);
        }
    };

    return Startable;
})(Fossil);

Fossil.Service = (function (Fossil, _, Backbone) {
    'use strict';

    Fossil.Services = {};

    var Service = function (options) {
        this.options = _.extend({}, this.options, options || {});
        this.registerEvents();
        this.initialize.apply(this, arguments);
    };

    _.extend(Service.prototype, Fossil.Mixins.Observable, {
        // create a link to those methods in every element exposed
        // to the service
        // @array
        exposedMethods: null,

        // default options
        options: {
            // default configuration for service methods exposure
            expose: false,
            // default configuration for service link
            link: false,
            // should the service methods be exposed  to app context ?
            // an exposed methods will be exposed under app[serviceMethod]
            exposeToApplication: null,
            // should there be a shortlink on application
            // this would make service available under application[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToApplication: null,
            // should the service methods be exposed  to module context ?
            // an exposed methods will be exposed under module[serviceMethod]
            exposeToModule: null,
            // should there be a shortlink on module
            // this would make service available under module[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToModule: null,
            // should the service methods be exposed to fragement context ?
            // an exposed methoods will be available under fragement[serviceMethod]
            exposeToFragment: null,
            // should there be a shortlink on fragement
            // this would make service available under fragement[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToFragment: null
        },
        // A hook to initialize service,
        // after application and modules are initialized.
        initialize: function (options) {
        },

        // activate Service for application
        activateApplication: function (application, id) {
            var service = this;
            this.prefixEvent = _.bind(prefixEvent, this, id);
            if (processConfig(this, 'exposeToApplication', 'expose')) {
                this.doExpose(application, id);
            }
            if (processConfig(this, 'linkToApplication', 'link')) {
                this.undoLink(application, id);
            }

            // create pubSub
            this.application = application.createPubSub(this, 'applicationEvents');
            // activate application
            this._doActivateApplication(application);
            // activate all modules
            _.each(application.getModule(), function (module) {
                service.activateModule.call(service, module, application, id);
            });
            // register on new module connection
            this.listenTo(application, 'module:connect', _.bind(this.activateModuleListener, this, id));
            this.listenTo(application, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            // tell the world we're ready
            application.trigger(this.prefixEvent('ready'), this);
        },
        // unplug for application
        suspendApplication: function (application, id) {
            var service = this;
            // suspend for every application modules
            _.each(application.getModule(), function (module) {
                service.suspendModule.call(service, module, application, id);
            });
            if (processConfig(this, 'exposeToApplication', 'expose')) {
                this.undoExpose(application, id);
            }
            if (processConfig(this, 'linkToApplication', 'link')) {
                this.undoLink(application, id);
            }
            // remove event handler
            this.stopListening();
            // remove pubsub reference
            this.application = null;
            // finally suspend for application
            this._doSuspendApplication(application);
        },

        activateModule: function (module, application, id) {
            if (!module.services) {
                // module isn't booted yet.
                return ;
            }
            if (processConfig(this, 'exposeToModule', 'expose')) {
                this.doExpose(module, id);
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                this.doLink(module, id);
            }
            this._doActivateModule.apply(this, arguments);
            this.listenTo(module, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            module.trigger(this.prefixEvent('ready'), this);
        },
        suspendModule: function (module, application, id) {
            if (processConfig(this, 'exposeToModule', 'expose')) {
                this.undoExpose(module, id);
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                this.undoLink(module, id);
            }
            this._doSuspendModule.apply(this, arguments);
        },
        activateModuleListener: function (id, module, path, application) {
            this.activateModule(module, application, id);
        },

        activateFragment: function (fragment, parent, id) {
            if (!fragment.services) {
                // fragment isn't booted yet.
                return ;
            }
            if (processConfig(this, 'exposeToFragment', 'expose')) {
                this.doExpose(fragment, id);
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                this.doLink(fragment, id);
            }
            this._doActivateFragment.apply(this, arguments);
            this.listenTo(fragment, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            fragment.trigger(this.prefixEvent('ready'), this);
        },
        suspendFragment: function (fragment, parent, id) {
            if (processConfig(this, 'exposeToFragment', 'expose')) {
                this.undoExpose(fragment, id);
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                this.undoLink(fragment, id);
            }
            this._doSuspendFragment.apply(this, arguments);
        },
        activateFragmentListener: function (id, fragment, parent) {
            this.activateFragment(fragment, parent, id);
        },

        doLink: function (element, serviceid) {
            element[serviceid] = this;
        },
        undoLink: function (element, serviceid) {
            element[serviceid] = null;
        },
        doExpose: function (element, serviceid) {
            var service = this;
            _.each(this.exposedMethods, function (methodname) {
                element[methodname] = _.bind(service[methodname], service);
            });
        },
        undoExpose: function (element, serviceid) {
            _.each(this.exposedMethods, function (methodname) {
                element[methodname] = null;
            });
        },

        // activate service on application.
        // this method has to be overriden with the service logic.
        _doActivateApplication: function (application) {
        },
        // activate service on module.
        // this method has to be overriden with the service logic.
        _doActivateModule: function (module, application) {
        },
        // activate service on fragment.
        // this method has to be overriden with the service logic.
        _doActivateFragment: function (fragment, parent) {
        },
        // suspend service on application.
        // this method has to be overriden with the service logic.
        _doSuspendApplication: function (application) {
        },
        // suspend service on module.
        // this method has to be overriden with the service logic.
        _doSuspendModule: function (module, application) {
        },
        // suspend service on fragment.
        // this method has to be overriden with the service logic.
        _doSuspendFragment: function (fragment, parent) {
        }
    });

    function prefixEvent (id, event) {
        return ['service', id, event].join(':');
    }

    function processConfig(service, prop, defaultProp) {
        prop = _.result(service.options, prop);
        if (prop !== null) {
            return prop;
        }

        return _.result(service.options, defaultProp);
    }

    Service.extend = function () {
        var options = this.prototype.options;
        var child = Backbone.Model.extend.apply(this, arguments);
        child.prototype.options = _.extend({}, this.prototype.options, child.prototype.options ||{});
        return child;
    };

    return Service;
})(Fossil, _, Backbone);

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

Fossil.Module = (function (Fossil, _, Backbone) {
    'use strict';

    var Module = function (options) {
        this.options = options || {};
        if (typeof this.options.path === "string") {
            this.path = _.result(this.options, 'path');
        }

        // init event listeners
        this.registerEvents();
        // init layoutable
        this.initLayoutable();
        // init fragmentable
        this.initFragmentable();
        // finally call initialize method
        this.initialize.call(this);
    };

    _.extend(Module.prototype,
        Fossil.Mixins.Observable,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layoutable,
        Fossil.Mixins.Fragmentable,
        Fossil.Mixins.Deferrable,
        Fossil.Mixins.Startable, {
            // events bound on application PubSub
            applicationEvents: {},
            // events bound on module PubSub
            events: {},
            initialize: function () {},
            registerEvents: function () {
                Fossil.Mixins.Observable.registerEvents.call(this);
                this.listenTo(this, 'connect', _.bind(this.connectListener, this));
            },
            connectListener: function (application, id) {
                // a PubSub object to communicate with the application
                this.application = application.createPubSub(this, 'applicationEvents');
                // if not already defined
                if (typeof this.path !== "string") {
                    this.path = id;
                }
                // link services
                this.services = application.services;
                // start and stop when element is set or unset
                this.listenTo(this, 'elementable:attach', _.bind(this.elementAttachListener, this, application));
                this.listenTo(this, 'elementable:detach', _.bind(this.elementDetachListener, this, application));
            },
            elementAttachListener: function (application) {
                this.start();
                this.thenWith(this, this.render);
            },
            elementDetachListener: function (application) {
                this.standby();
            },
            render: function () {
                this.renderLayout();
                this.renderFragments();
            },
            // called when selected module is changing.
            // this is used to terminate current module before
            // the new one is setup.
            _doStandby: function (application) {
                Fossil.Mixins.Startable._doStandby.apply(this, arguments);
                this.removeFragments();
                this.removeLayout();
            }
    });

    Module.extend = Backbone.Model.extend;

    return Module;
})(Fossil, _, Backbone);

Fossil.Fragment = (function (Fossil) {

    var Fragment = function (ancestor, options) {
        this.options = options || {};
        this.services = {};
        this.path = ancestor.path || '';
        this.ancestor = ancestor.createPubSub(this, 'ancestorEvents');
        // link services
        this.services = ancestor.services;
        this.registerEvents();
        this.initLayoutable();
        this.initFragmentable();
        this.initialize.apply(this, arguments);
    };
    _.extend(Fragment.prototype,
        Fossil.Mixins.Observable,
        Fossil.Mixins.Elementable,
        Fossil.Mixins.Layoutable,
        Fossil.Mixins.Fragmentable,
        Fossil.Mixins.Deferrable,
        Fossil.Mixins.Startable, {
            initialize: function () {},
            fagments: {},
            // usually container is the Fragmentable
            // but in case of Fragment, the Module or Application
            // should be used as container.
            // This ease communication.
            getFragmentAncestor: function () {
                return this.ancestor;
            },
            registerEvents: function () {
                Fossil.Mixins.Observable.registerEvents.call(this);
                this.listenTo(this, 'elementable:attach', _.bind(this.start, this));
                this.listenTo(this, 'elementable:detach', _.bind(this.standby, this));

                this.listenTo(this.ancestor, 'standby', _.bind(this.standby, this));
                this.listenTo(this.ancestor, 'stop', _.bind(this.stop, this));
            },
            render: function () {
                this.renderLayout();
                this.renderFragments();
                this.trigger('render');
                return this;
            },
            remove: function () {
                this.trigger('remove');
                this.removeFragments();
                this.removeLayout();
                return this;
            }
    });

    Fragment.extend = Backbone.Model.extend;

    return Fragment;
})(Fossil);

Fossil.Services.Routing = (function (Fossil, _, Backbone) {
    'use strict';

    var Routing = Fossil.Service.extend({
        options: {
            // prefix to use for every route
            prefix: '',
            // default options for navigate method
            navigate: {
                trigger: true
            }
        },
        initialize: function () {
            // create router
            this.router = new Backbone.Router();
            this.registerRoutesFor(this);
        },

        registerRoutesFor: function (component, prefix) {
            var service = this;
            var routes = _.extend(
                component.routes || {},
                component.options.routes || {}
            );
            prefix = prefixPath(prefix, this.options.prefix);
            _.each(routes, function (route, path) {
                service.router.route(
                    prefixPath(path, prefix),
                    _.bind(service.routeListener, service, component, route)
                );
            });
        },
        _doActivateApplication: function (application) {
            // add all application routes
            this.registerRoutesFor(application);

            // add event handler on router:navigate
            // to trigger navigation
            this.listenTo(application, 'router:navigate', _.bind(this.navigate, this));
            this.listenTo(application, 'start', _.bind(this.startListener, this));
        },
        _doActivateModule: function (module, application) {
            // add all module routes
            var service = this;
            var prefix = prefixPath(module.path, this.options.prefix);
            _.each(module.routes || {}, function (eventname, path) {
                service.router.route(
                    prefixPath(path, prefix),
                    eventname,
                    _.bind(service.moduleRouteListener, service, application, module, eventname)
                );
            });
        },
        _doSuspendApplication: function (application) {
            // remove all application routes
            Backbone.history.stop();
            // remove event handler for navigation
            this.stopListening();
        },
        _doSuspendModule: function (module, application) {
            // remove all module routes
        },

        startListener: function () {
            Backbone.history.start(this.options.history);
        },
        moduleRouteListener: function (application, module, route) {
            var service = this;
            var args = _.tail(_.tail(_.tail(arguments)));
            application.switchModule(module);
            module.then(function () {
                service._callRoute(module, module, route, args);
            });
        },
        routeListener: function (component, route) {
            var service = this;
            var args = _.tail(_.tail(arguments));
            if (component.then) {
                component.then(function () {
                    service._callRoute(service.application, component, route, args);
                });
            } else {
                service._callRoute(service.application, component, route, args);
            }
        },

        navigate: function (fragment, options) {
            var o = _.extend(
                {},
                this.options.navigate || {},
                options || {}
            );
            this.router.navigate.call(this.router, fragment, o);
        },
        _callRoute: function (observable, component, route, args) {
            if (_.isFunction(route)) {
                // in case of function
                route.apply(component, args);

            } else if (_.isFunction(component[route])) {
                // in case a method name is given
                component[route].apply(component, args);

            } else if (_.isString(route)) {
                // in case it's a string, use it as event name
                observable.trigger.apply(component, [route].concat(args));
            } else {
                throw new Error('Invalid route definition');
            }
        }
    });

    function prefixPath(path, prefix) {
        return [ prefix || '', path || '' ].join('');
    }

    return Routing;
})(Fossil, _, Backbone);

// Fossil.Services.Session helps in sharing data between every layer
// this service is exposed to modules as well as application.
//
// ```javascript
// new Fossil.Application({
//   services: {
//     session: Fossil.Services.Session
//   },
//   modules: {
//     '': Fossil.Module.extend({
//         foo: function () {
//             this.services.session.get('user');
//         }
//     })
//   }
// });
// ```
Fossil.Services.Session = (function (Fossil, _, Backbone) {
    'use strict';

    function requireApplicationError () {
        throw new Error();
    }
    // methods of model to expose directly in the service instance.
    var expose = ['get', 'set', 'has'];

    var Session = Fossil.Service.extend({
        options: {
            expose: true,
            defaults: {}
        },
        _doActivateApplication: function(application, id) {
            var service = this;

            this.model = new Backbone.Model(this.options.defaults || {});
            _.each(expose, function (method) {
                service[method] = _.bind(service.model[method], service.model);
            });
        },
        _doSuspendApplication: function(application, id) {
            var service = this;

            this.model = null;
            _.each(expose, function (method) {
                service[method] = requireApplicationError;
            });
        }
    });

    _.each(expose, function (method) {
        Session.prototype[method] = requireApplicationError;
    });

    return Session;
})(Fossil, _, Backbone);
return Fossil;
})(_, Backbone, jQuery);