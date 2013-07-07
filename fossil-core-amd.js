define('fossil', ['underscore', 'backbone', 'jquery'], function (_, Backbone, jQuery) {
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

    var LayoutView = Backbone.View.extend({
        initialize: function (options) {
            this.template = options.template;
        },
        render: function () {
            this.$el.html(_.result(this.options, 'template'));
            return this;
        }
    });

    var Layoutable = {
        // use the template property to specify template.
        template: null,
        setupLayout: function () {
            var layout = this.template;
            if (this.options && this.options.template) {
                layout = this.options.template;
            }

            // place layout property in the object.
            if (_.isFunction(layout) && !layout.prototype.render) {
                layout = layout.call(this);
            }
            if (typeof layout === 'string') {
                layout = new LayoutView({
                    el: this.$el,
                    template: layout
                });
            } else if (!layout) {
                // use the html content
                layout = new LayoutView({
                    el: this.$el,
                    template: this.$el.html()
                });
            } else if (layout instanceof Backbone.View) {
                this.$el.append(layout.$el);
            } else if (layout.prototype.render) {
                layout = new layout({});
                this.$el.append(layout.$el);
            }
            this.layout = layout;
            this.trigger('layout:setup', this);
        },
        renderLayout: function () {
            if (!this.layout) {
                this.setupLayout();
            }
            this.layout.render();
            this.trigger('layout:render', this);
        },
        removeLayout: function () {
            if (this.layout && this.layout.$el[0] !== this.$el[0]) {
                this.layout.remove();
            } else {
                this.layout.undelegateEvents();
            }
            this.trigger('layout:remove', this);
        }
    };

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
        // default options
        options: {
            // default configuration for service exposure
            expose: false,
            // default configuration for service link
            link: false,
            // should there be a shortlink on application
            // this would make service available under application[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToApplication: null,
            // should the service be exposed  to module context ?
            // an exposed service will be available under module.services[serviceid]
            exposeToModule: null,
            // should there be a shortlink on module
            // this would make service available under module[serviceid]
            // to avoid conflic this MUST be set by user.
            linkToModule: null,
            // should the service be exposed  to fragement context ?
            // an exposed service will be available under fragement.services[serviceid]
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
            if (processConfig(this, 'linkToApplication', 'link')) {
                application[id] = this;
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
            if (processConfig(this, 'linkToApplication', 'link')) {
                application[id] = null;
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
                module.services[id] = this;
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                module[id] = this;
            }
            this._doActivateModule.apply(this, arguments);
            this.listenTo(module, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            module.trigger(this.prefixEvent('ready'), this);
        },
        suspendModule: function (module, application, id) {
            if (processConfig(this, 'exposeToModule', 'expose')) {
                module.services[id] = null;
            }
            if (processConfig(this, 'linkToModule', 'link')) {
                module[id] = null;
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
                fragment.services[id] = this;
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                fragment[id] = this;
            }
            this._doActivateFragment.apply(this, arguments);
            this.listenTo(fragment, 'fragmentable:fragment:setup', _.bind(this.activateFragmentListener, this, id));
            fragment.trigger(this.prefixEvent('ready'), this);
        },
        suspendFragment: function (fragment, parent, id) {
            if (processConfig(this, 'exposeToFragment', 'expose')) {
                fragment.services[id] = null;
            }
            if (processConfig(this, 'linkToFragment', 'link')) {
                fragment[id] = null;
            }
            this._doSuspendFragment.apply(this, arguments);
        },
        activateFragmentListener: function (id, fragment, parent) {
            this.activateFragment(fragment, parent, id);
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

    var Module = function (application, path, options) {
        if (typeof path === "string") {
            this.path = path;
            this.options = options || {};
        } else {
            options = path || {};
            this.path = options.path || '';
            this.options = options;
        }

        // a PubSub object for communication with the application
        this.application = application.createPubSub(this, 'applicationEvents');
        // init services namespace
        this.services = {};
        // init event listeners
        this.registerEvents(application);
        // init fragmentable
        this.initFragmentable();
        // finally call initialize method
        this.initialize.call(this, application);
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
            initialize: function (application) {

            },
            registerEvents: function (application) {
                Fossil.Mixins.Observable.registerEvents.call(this);
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
            render: function (application) {
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
        this.registerEvents();
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

        registerRoutesFor: function (element, prefix) {
            var service = this;
            var routes = _.extend(
                element.routes || {},
                element.options.routes || {}
            );
            prefix = prefixPath(prefix, this.options.prefix);
            _.each(routes, function (route, path) {
                service.router.route(
                    prefixPath(path, prefix),
                    _.bind(service.routeListener, service, element, route)
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
        routeListener: function (element, route) {
            var service = this;
            var args = _.tail(_.tail(arguments));
            if (element.then) {
                element.then(function () {
                    service._callRoute(service.application, element, route, args);
                });
            } else {
                service._callRoute(service.application, element, route, args);
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
        _callRoute: function (observable, element, route, args) {
            if (_.isFunction(route)) {
                // in case of function
                route.apply(element, args);

            } else if (_.isFunction(element[route])) {
                // in case a method name is given
                element[route].apply(element, args);

            } else if (_.isString(route)) {
                // in case it's a string, use it as event name
                observable.trigger.apply(element, [route].concat(args));
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
    var exposed = ['get', 'set', 'has'];

    var Session = Fossil.Service.extend({
        options: {
            expose: true,
            defaults: {}
        },
        _doActivateApplication: function(application, id) {
            var service = this;

            this.model = new Backbone.Model(this.options.defaults || {});
            _.each(exposed, function (method) {
                service[method] = _.bind(service.model[method], service.model);
            });
        },
        _doSuspendApplication: function(application, id) {
            var service = this;

            this.model = null;
            _.each(exposed, function (method) {
                service[method] = requireApplicationError;
            });
        }
    });

    _.each(exposed, function (method) {
        Session.prototype[method] = requireApplicationError;
    });

    return Session;
})(Fossil, _, Backbone);
return Fossil;
});