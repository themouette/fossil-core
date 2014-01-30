var Fossil = (function () {
var deferred = function ($) {
        
        return $.Deferred;
    }(jquery);
var utils = function (_) {
        
        var messages = { invalid_src: 'Invalid source object.' };
        function scalarOrArray(method) {
            return function () {
                var extra = _.rest(arguments);
                var arg = _.first(arguments);
                if (_.isArray(arg)) {
                    return _.map(arg, function (arg) {
                        return method.apply(this, [arg].concat(extra));
                    }, this);
                }
                return method.apply(this, arguments);
            };
        }
        function keyValueOrObject(method) {
            return function (key, value) {
                var extra;
                if (typeof key !== 'string') {
                    extra = _.rest(arguments, 1);
                    return _.map(key, function (value, key) {
                        return method.apply(this, [
                            key,
                            value
                        ].concat(extra));
                    }, this);
                }
                extra = _.rest(arguments, 2);
                return method.apply(this, arguments);
            };
        }
        return {
            scalarOrArray: scalarOrArray,
            keyValueOrObject: keyValueOrObject,
            copyOption: scalarOrArray(function (key, to, from) {
                if (from && typeof from[key] !== 'undefined') {
                    to[key] = from[key];
                }
            }),
            getProperty: scalarOrArray(function (key, from, alt) {
                var keys = key.split('.');
                var result = _.reduce(keys, function (accumulator, property) {
                        if (accumulator && property in accumulator) {
                            return accumulator[property];
                        }
                        return;
                    }, from);
                return typeof result !== 'undefined' ? result : alt;
            }),
            setProperty: keyValueOrObject(function (key, value, to) {
                var keys = key.split('.');
                var prop = keys.pop();
                var result = _.reduce(keys, function (accumulator, property) {
                        if (!accumulator instanceof Object) {
                            throw new Error(messages.invalid_src);
                        }
                        if (property in accumulator) {
                            return accumulator[property];
                        }
                        accumulator[property] = {};
                        return accumulator[property];
                    }, to);
                if (prop) {
                    result[prop] = value;
                }
            })
        };
    }(underscore);
var mixin = function (_, utils) {
        
        var specials = ['initialize'];
        function isSpecialFunction(name) {
            return -1 !== specials.indexOf(name);
        }
        function delegateMixin(self, mixin) {
            _.each(mixin, function (method, name) {
                if (!self[name] && !isSpecialFunction(name)) {
                    self[name] = method;
                }
            });
        }
        function undelegateMixin(self, mixin) {
            _.each(mixin, function (method, name) {
                if (!isSpecialFunction(name) && method === self[name]) {
                    delete self[name];
                }
            });
        }
        function Mixin() {
            var self = this;
            var args = arguments;
            _.each(this.mixins, function (mixin) {
                if (typeof mixin.initialize === 'function') {
                    mixin.initialize.apply(self, args);
                }
            });
        }
        Mixin.prototype.mixins = [];
        _.extend(Mixin, {
            mix: utils.scalarOrArray(function (mixin) {
                var mixins = this.prototype.mixins || [];
                if (-1 === mixins.indexOf(mixin)) {
                    mixins.push(mixin);
                    delegateMixin(this.prototype, mixin);
                }
                return this;
            }),
            unmix: utils.scalarOrArray(function (mixin) {
                var mixins = this.prototype.mixins;
                var index = mixins.indexOf(mixin);
                if (-1 === mixins.indexOf(mixin)) {
                    return this;
                }
                mixins.splice(index, 1);
                undelegateMixin(this.prototype, mixin);
                return this;
            }),
            extend: function (protoProps, staticProps) {
                var parent = this;
                var child;
                if (protoProps && _.has(protoProps, 'constructor')) {
                    child = protoProps.constructor;
                } else {
                    child = function () {
                        return parent.apply(this, arguments);
                    };
                }
                _.extend(child, parent, staticProps);
                var Surrogate = function () {
                    this.constructor = child;
                };
                Surrogate.prototype = parent.prototype;
                child.prototype = new Surrogate();
                if (protoProps)
                    _.extend(child.prototype, protoProps);
                child.prototype.mixins = _.clone(child.prototype.mixins || []);
                child.__super__ = parent.prototype;
                return child;
            }
        });
        return Mixin;
    }(underscore, utils);
var modules_region = function (utils, _, Module, RegionManager) {
        
        var RegionModule = Module.extend({
                layout: null,
                constructor: function (options) {
                    utils.copyOption(['layout'], this, options);
                    this.forwardModuleAttach = utils.keyValueOrObject(this.forwardModuleAttach);
                    _.bindAll(this, 'setModuleRegion');
                    Module.apply(this, arguments);
                },
                _doStart: function () {
                    this.initLayout();
                    this.forwardModuleAttach(this.modules);
                    Module.prototype._doStart.apply(this, arguments);
                },
                _doStandby: function () {
                    Module.prototype._doStandby.apply(this, arguments);
                    this.removeLayout();
                    _.each(this.modules, function (mod) {
                        mod.stopListening(this);
                    }, this);
                },
                connect: function (id, module, options) {
                    utils.copyOption('region', module, options);
                    Module.prototype.connect.apply(this, arguments);
                    if (this.run) {
                        this.forwardModuleAttach(id, module);
                    }
                    return this;
                },
                computeLayoutOptions: function (options) {
                    return options;
                },
                createLayout: function (options) {
                    return new RegionManager(options);
                },
                initLayout: function () {
                    var layout = _.result(this, 'layout');
                    var options;
                    if (!layout) {
                        options = this.computeLayoutOptions({ managerRendering: false });
                        layout = this.createLayout(options);
                    }
                    this.layout = layout;
                    this.useView(this.layout);
                    return this;
                },
                removeLayout: function () {
                    this.layout.remove();
                    return this;
                },
                forwardModuleAttach: function (moduleid, module) {
                    this.listenTo(module, 'do:view:attach', this.setModuleRegion);
                    this.listenTo(module, 'do:view:attach', _.bind(this.moduleSelectedListener, this, moduleid));
                    return this;
                },
                setRegion: function (view, region) {
                    this.layout.registerView(view, region);
                    return this;
                },
                setModuleRegion: function (module, view, region) {
                    this.setRegion(view, region || module.region);
                    return this;
                },
                moduleSelectedListener: function (moduleid, module, view, region) {
                    region || (region = module.region);
                    module.trigger('parent!do:module:select', region, moduleid, module, view);
                    var eventname = _.template('parent!do:module:select:<%- region %>', { region: region });
                    module.trigger(eventname, moduleid, module, view);
                }
            });
        return RegionModule;
    }(utils, underscore, module, views_regionManager);
var modules_lazy = function (utils, _, Module) {
        
        var LazyModule = Module.extend({
                initialize: function (options) {
                    this.options = options;
                    utils.copyOption('factory', this, options);
                },
                events: { 'do:connect:to:parent': 'connectListener' },
                factory: function (options) {
                    console.error('Please provide a factory to LazyModule');
                },
                connectListener: function (parent, childid, child) {
                    var extra = _.tail(arguments, 3);
                    var lazy = this;
                    parent.once('start', function () {
                        parent.route(lazy.url + '*parts', _.bind(lazy.loadOnRouteMatch, lazy, parent, childid, extra));
                    });
                },
                loadOnRouteMatch: function (parent, id, extra, uri) {
                    var child = this.factory(this.options);
                    parent.connect.apply(parent, [
                        id,
                        child
                    ].concat(extra));
                    child.then(function () {
                        child.navigate('loading', {
                            trigger: true,
                            replace: true
                        });
                        child.navigate(uri, {
                            trigger: true,
                            replace: true
                        });
                    });
                }
            });
        return LazyModule;
    }(utils, underscore, module);
var mixins_observable = function (_, Backbone) {
        
        var exposedPubsubProperties = [
                '_listenerId',
                'createPubSub'
            ].concat(_.keys(Backbone.Events));
        var Observable = _.extend({}, Backbone.Events, {
                eventModifiers: null,
                initialize: function (options) {
                    this.eventModifiers = [];
                    var events = _.extend({}, _.result(this, 'events'), _.result(options || {}, 'events'));
                    var observable = this;
                    this.initializeEventModifiers(options);
                    this.events = events;
                    _.each(events, function (method, eventid) {
                        if (!_.isFunction(method)) {
                            method = observable[method];
                        }
                        observable.listenTo(observable, eventid, _.bind(method, observable));
                    });
                },
                initializeEventModifiers: function (options) {
                    this.addEventModifier('one', oneEvent, ['trigger']);
                    this.addEventModifier('map', mapEvent, ['trigger']);
                },
                createPubSub: function (observer, property) {
                    var pubsub = {}, observable = this;
                    _.each(exposedPubsubProperties, function (property) {
                        if (_.isFunction(observable[property])) {
                            pubsub[property] = _.bind(observable[property], observable);
                        } else {
                            pubsub[property] = observable[property];
                        }
                    });
                    if (!observer) {
                        return pubsub;
                    }
                    var events = _.extend({}, _.result(observer, property), _.result(observer.options || {}, property));
                    _.each(events, function (method, eventid) {
                        if (!_.isFunction(method)) {
                            method = observer[method];
                        }
                        observable.listenTo(observable, eventid, _.bind(method, observer));
                    });
                    return pubsub;
                },
                forward: function (src, dest) {
                    this.on(src, forward(this, dest));
                    return this;
                },
                addEventModifier: function (matcher, hook, methods) {
                    methods || (methods = 'all');
                    if (!(matcher instanceof RegExp)) {
                        matcher = ensureRegexp(matcher);
                    }
                    this.eventModifiers.push({
                        matcher: matcher,
                        action: hook,
                        methods: methods
                    });
                    return this;
                },
                removeEventModifier: function (matcher) {
                    if (!(matcher instanceof RegExp)) {
                        matcher = ensureRegexp(matcher);
                    }
                    this.eventModifiers = _.reduce(this.eventModifiers, function (accumulator, modifier) {
                        if (modifier.matcher.toString() !== matcher.toString()) {
                            accumulator.push(modifier);
                        }
                        return accumulator;
                    }, []);
                    return this;
                }
            });
        _.each([
            'on',
            'off',
            'once',
            'trigger',
            'listenTo',
            'listenToOnce',
            'stopListening'
        ], function (method) {
            Observable[method] = function wrapEventMethod(eventname) {
                var extra = _.rest(arguments);
                var ret;
                var matched = _.any(this.eventModifiers, function (modifier) {
                        if (modifier.methods !== 'all' && -1 === modifier.methods.indexOf(method)) {
                            return false;
                        }
                        if (modifier.matcher.test(eventname)) {
                            eventname = eventname.match(modifier.matcher)[1];
                            ret = modifier.action(this, method, eventname, extra);
                            return true;
                        }
                        return false;
                    }, this);
                if (matched) {
                    return ret;
                }
                Backbone.Events[method].apply(this, arguments);
                return this;
            };
        });
        var forward = function (observable, eventname) {
            return function (original) {
                var args = _.toArray(arguments);
                observable.trigger.apply(observable, [eventname].concat(args));
            };
        };
        function ensureRegexp(str) {
            return new RegExp('^' + str + '!(.*)$', 'i');
        }
        function oneEvent(obj, method, event, extra) {
            var listener = obj._events && obj._events[event] ? _.first(obj._events[event]) : null;
            if (listener) {
                return listener.callback.apply(listener.context || obj, extra);
            }
            return null;
        }
        function mapEvent(obj, method, event, extra) {
            if (!obj._events) {
                return [];
            }
            return _.map(obj._events[event], function (listener) {
                return listener.callback.apply(listener.context || obj, extra);
            }, obj);
        }
        return Observable;
    }(underscore, backbone);
var service = function (_, utils, Mixin, Observable) {
        
        var Service = Mixin.extend({
                expose: null,
                link: null,
                useDeep: null,
                use: function (module, parent) {
                },
                dispose: function (module, parent) {
                },
                constructor: function (options) {
                    Mixin.apply(this, arguments);
                    utils.copyOption([
                        'link',
                        'expose',
                        'useDeep'
                    ], this, options);
                    this.on('do:use:module', this.doUseModuleListener, this);
                    this.on('do:dispose:module', this.doDisposeModuleListener, this);
                    if (typeof this.initialize === 'function') {
                        this.initialize.apply(this, arguments);
                    }
                },
                doUseModuleListener: function (module, serviceid, service) {
                    use(this, serviceid, module);
                },
                doDisposeModuleListener: function (module, serviceid, service) {
                    dispose(this, serviceid, module);
                },
                onChildConnectListener: function (serviceid, child, childid, parent) {
                    use(this, serviceid, child, parent, childid);
                },
                onChildDisconnectListener: function (serviceid, child, childid, parent) {
                    dispose(this, serviceid, child, parent, childid);
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
                }
            });
        Service.mix(Observable);
        function use(service, serviceid, module, parent, childid) {
            if (_.result(service, 'link')) {
                service.doExpose(module, serviceid);
            }
            if (_.result(service, 'expose')) {
                service.doExpose(module, serviceid);
            }
            service.use(module, parent, childid);
            if (service.useDeep) {
                _.each(module.modules, function (submodule, childid) {
                    use(service, serviceid, submodule, module, childid);
                }, service);
                module.on('on:child:connect', _.bind(service.onChildConnectListener, service, serviceid));
                module.on('on:child:disconnect', _.bind(service.onChildDisconnectListener, service, serviceid));
            }
        }
        function dispose(service, serviceid, module, parent, childid) {
            if (_.result(service, 'link')) {
                service.undoLink(module, serviceid);
            }
            if (_.result(service, 'expose')) {
                service.undoExpose(module, serviceid);
            }
            if (service.useDeep) {
                _.each(module.modules, function (submodule, childid) {
                    dispose(service, serviceid, submodule, module, childid);
                }, service);
                module.off('on:child:connect', null, service);
                module.off('on:child:disconnect', null, service);
            }
            service.dispose(module, parent, childid);
        }
        return Service;
    }(underscore, utils, mixin, mixins_observable);
var observableBuffer = function (Mixin, _) {
        
        var ObservableBuffer = Mixin.extend({
                constructor: function () {
                    this.store = [];
                    Mixin.apply(this, arguments);
                },
                replay: function (on) {
                    _.each(this.store, function (step) {
                        var method = step[0];
                        var args = step[1];
                        switch (method) {
                        case 'on':
                        case 'off':
                        case 'once':
                            callAndReplaceWithArg(method, args, 2, on, this);
                            break;
                        case 'stopListening':
                        case 'listenToOnce':
                        case 'listenTo':
                            callAndReplaceWithArg(method, args, 1, on, this);
                            break;
                        default:
                            on[method].apply(on, args);
                        }
                    }, this);
                }
            });
        function callAndReplaceWithArg(method, args, position, on, ifEqual) {
            var newArgs;
            if (args && ifEqual === args[position]) {
                newArgs = args.slice(0, position).concat([on]).concat(args.slice(position + 1));
            } else {
                newArgs = args;
            }
            on[method].apply(on, newArgs);
        }
        _.each([
            'on',
            'off',
            'once',
            'listenTo',
            'listenToOnce',
            'stopListening',
            'trigger'
        ], function (method) {
            ObservableBuffer.prototype[method] = function storeCall() {
                var args = _.toArray(arguments);
                this.store.push([
                    method,
                    args
                ]);
                return this;
            };
        });
        return ObservableBuffer;
    }(mixin, underscore);
var viewStore = function (_, utils, Mixin) {
        
        var ViewStore = Mixin.extend({
                factories: null,
                views: null,
                constructor: function () {
                    this.factories = _.clone(this.factories || {});
                    this.views = _.clone(this.views || {});
                    Mixin.apply(this, arguments);
                    this.initialize.apply(this, arguments);
                },
                initialize: function () {
                },
                get: function (id) {
                    var view, factory;
                    if (this.views[id]) {
                        return this.views[id];
                    }
                    factory = this.factories[id];
                    if (typeof factory === 'function') {
                        view = factory.apply(factory, _.rest(arguments, 1));
                    } else {
                        view = factory;
                    }
                    if (view && view.recycle) {
                        this.views[id] = view;
                    }
                    return view;
                },
                set: utils.keyValueOrObject(function (id, view) {
                    if (this.views[id]) {
                        this.views[id].remove();
                    }
                    this.factories[id] = view;
                    return this;
                }),
                has: function (id) {
                    return this.views[id] || this.factories[id];
                },
                clean: function () {
                    _.each(this.views, function (view, id) {
                        this.remove(id);
                    }, this);
                    this.factories = [];
                    return this;
                },
                remove: function (id) {
                    if (this.views[id]) {
                        this.views[id].remove(true);
                    }
                }
            });
        return ViewStore;
    }(underscore, utils, mixin);
var mixins_startable = function (_, Deferred) {
        
        var Startable = {
                run: false,
                start: function () {
                    if (this.run) {
                        return false;
                    }
                    this.run = true;
                    var d = new Deferred();
                    this.waitFor(d);
                    if (!this._firstStarted) {
                        this._firstStarted = true;
                        this._firstStart();
                    }
                    this._doStart();
                    d.resolve(true);
                    this.thenWith(this, null, this._startError);
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
                _startError: function (error) {
                    throw error;
                },
                _stopError: function (error) {
                    throw error;
                },
                _firstStart: function () {
                    this.trigger('start:first', this);
                },
                _doStart: function () {
                    this.trigger('start', this);
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
    }(underscore, deferred);
var mixins_deferrable = function (_, Deferred) {
        
        var messages = {
                timeout: 'async process timed out',
                rejected: 'some asynchronous process failed',
                missing_method: function (method) {
                    _.template('Promise has no `<%= method %>` method.', { method: method });
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
                waitForFetch: function (obj, options) {
                    var req = obj.fetch();
                    var deferred = new Deferred();
                    this.waitFor(deferred, options);
                    req.then(function fetchSuccess() {
                        deferred.resolve(obj);
                    }, function fetchError(err) {
                        deferred.reject(err);
                    });
                    return this;
                },
                waitForFetchOnce: function (obj, options) {
                    if (!obj.loaded) {
                        this.waitForFetch(obj, options).then(null, function () {
                            obj.loaded = false;
                        });
                        obj.loaded = true;
                        return this;
                    }
                    this.waitFor(obj, options);
                    return this;
                },
                then: function (success, error, always) {
                    var extra = _.tail(arguments, 3);
                    if (!this.isWaiting()) {
                        if (success) {
                            success();
                        }
                        if (always) {
                            always();
                        }
                        return this;
                    }
                    this.async.then(success ? _.partial.apply(_, [success].concat(extra)) : success, error ? _.partial.apply(_, [error].concat(extra)) : error, always ? _.partial.apply(_, [always].concat(extra)) : always);
                    return this;
                },
                thenWith: function (context, success, error, always) {
                    var extra = _.tail(arguments, 4);
                    return this.then.apply(this, [
                        success ? _.bind(success, context) : success,
                        error ? _.bind(error, context) : error,
                        always ? _.bind(always, context) : always
                    ].concat(extra));
                },
                abort: function () {
                    if (this.isWaiting()) {
                        this.async.abort();
                    }
                    return this;
                },
                isWaiting: function () {
                    return !!this.async && !!this.async.deferred && 'pending' === this.async.deferred.state();
                }
            };
        function clearDeferrable(deferrable) {
            deferrable.async = null;
        }
        function Wait() {
            this.deferred = new Deferred();
            this.promises = [];
            this.uuid = uuidCounter++;
            this.timeouts = [];
            this.results = [];
        }
        _.extend(Wait.prototype, {
            enqueue: function (promise, options) {
                promise = this.ensurePromise(promise);
                options = this.ensureOptions(options);
                promise.deferrableUuid = this.uuid;
                this.promises.push(promise);
                this.results.push(null);
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
            ensurePromise: function (promise) {
                if (promise && (promise.then || promise.done)) {
                    return promise;
                }
                var d = new Deferred();
                setTimeout(function () {
                    d.resolve(promise);
                }, 0);
                return d;
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
            onDone: function (promise) {
                if (!this.isValidPromise(promise)) {
                    return;
                }
                this.processAsyncReturn(promise, _.rest(arguments, 1));
            },
            onFail: function (promise, error) {
                if (!this.isValidPromise(promise)) {
                    return;
                }
                this.reject(error);
            },
            onAlways: function (promise) {
                if (!this.isValidPromise(promise)) {
                    return;
                }
                this.processAsyncReturn(promise, _.rest(arguments, 1));
            },
            reject: function (error) {
                this.deferred.reject(error);
                this.deferred.reject.apply(this.deferred, [error].concat(this.promises));
                this.stop();
            },
            processAsyncReturn: function (promise, data) {
                var processed = _.every(this.promises, function (p) {
                        return 'pending' !== p.state();
                    });
                _.any(this.promises, function (p, index) {
                    var args;
                    if (p === promise) {
                        this.results.splice(index, 1, data.length <= 2 ? data[0] : _.rest(data, 1));
                        if (data.length === 1) {
                            args = data[0];
                        } else if (data.length === 3 && data[2].statusText) {
                            args = data[0];
                        } else {
                            args = data;
                        }
                        this.results.splice(index, 1, args);
                    }
                }, this);
                if (!processed) {
                    return this;
                }
                var failed = _.any(this.promises, function (p) {
                        return 'resolved' !== p.state();
                    });
                if (failed) {
                    return this.reject(messages.rejected);
                }
                this.deferred.resolve.apply(this.deferred, this.results);
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
                this.uuid = null;
                _.each(this.timeouts, function (timeout) {
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                });
                this.onStop();
            }
        });
        return Deferrable;
    }(underscore, deferred);
var services_session = function (_, Backbone, utils, Service) {
        
        var expose = [
                'get',
                'set',
                'has',
                'save'
            ];
        var Session = Service.extend({
                model: null,
                constructor: function (options) {
                    utils.copyOption([
                        'defaults',
                        'model'
                    ], this, options);
                    Service.apply(this);
                    this.model || (this.model = new Backbone.Model(this.defaults || {}));
                    var service = this;
                    var m = this.model;
                    _.each(expose, function (method) {
                        service[method] = _.bind(m[method], m);
                    });
                },
                use: function (module, parent) {
                    this.listenTo(module, 'do:set:session', this.set);
                    this.listenTo(module, 'do:get:session', this.get);
                    this.listenTo(module, 'do:save:session', this.save);
                    this.listenTo(module, 'do:has:session', this.has);
                },
                dispose: function (module, parent) {
                    this.stopListening(module, 'do:store:session', this.set);
                    this.stopListening(module, 'do:get:session', this.get);
                    this.stopListening(module, 'do:save:session', this.save);
                    this.stopListening(module, 'do:has:session', this.has);
                }
            });
        return Session;
    }(underscore, backbone, utils, service);
var services_canvas = function ($, _, Service, utils) {
        
        var Canvas = Service.extend({
                selector: 'body',
                empty: true,
                useDeep: false,
                initialize: function (options) {
                    utils.copyOption([
                        'selector',
                        'empty'
                    ], this, options);
                    this.currentView = {};
                },
                use: function (module, parent) {
                    utils.copyOption(['selector'], module, module.options);
                    module.on('do:view:attach', this.attachView, this);
                },
                dispose: function (module, parent) {
                    module.off('do:view:attach', this.attachView, this);
                },
                attachView: function (module, view) {
                    var selector = module.selector || this.selector;
                    var $selector = $(selector);
                    if (this.currentView[selector]) {
                        this.currentView[selector].remove();
                    }
                    if (this.empty) {
                        $selector.empty();
                    }
                    this.currentView[selector] = view;
                    $selector.append(view.$el);
                    if (view._attachPlugins) {
                        view._attachPlugins();
                    } else if (view.attachPlugins) {
                        view.attachPlugins();
                    }
                }
            });
        return Canvas;
    }(jquery, underscore, service, utils);
var services_routing = function (_, Backbone, utils, Service) {
        
        var Routing = Service.extend({
                prefix: '',
                router: null,
                history: null,
                useDeep: true,
                initialize: function (options) {
                    utils.copyOption([
                        'router',
                        'prefix',
                        'history'
                    ], this, options);
                    _.bindAll(this, 'startHistory', 'stopHistory', 'navigate', 'route');
                    if (!this.router) {
                        this.router = new Backbone.Router();
                    }
                },
                use: function (module, parent, moduleid) {
                    if (!parent) {
                        this.listenTo(module, 'start:first', this.startHistory);
                        this.listenTo(module, 'stop', this.stopHistory);
                    }
                    this.listenTo(module, 'do:route:navigate', this.navigate);
                    this.listenTo(module, 'do:route:register', this.route);
                    this.setModuleUrl(module, parent, moduleid).registerModuleRoutes(module);
                },
                dispose: function (module, parent, moduleid) {
                    this.unregisterModuleRoutes(module);
                    module.url = null;
                    this.stopListening(module, 'do:route:navigate', this.navigate);
                    this.stopListening(module, 'do:route:register', this.route);
                    if (!parent) {
                        this.stopListening(module, 'start:first', this.startHistory);
                        this.stopListening(module, 'stop', this.stopHistory);
                    }
                },
                setModuleUrl: function (module, parent, moduleid) {
                    var parentUrl = parent ? parent.url : this.prefix;
                    utils.copyOption(['urlRoot'], module, module.options);
                    if (typeof module.urlRoot === 'undefined' || null === module.urlRoot) {
                        module.urlRoot = moduleid;
                    }
                    module.url = url(parentUrl, module.urlRoot);
                    return this;
                },
                registerModuleRoutes: function (module) {
                    var routes = module.routes;
                    if (!routes) {
                        return this;
                    }
                    _.each(routes, function (callback, path) {
                        module.route(path, callback);
                    });
                    return this;
                },
                unregisterModuleRoutes: function (module) {
                    var routes = module.routes;
                    if (!routes) {
                        return this;
                    }
                    console.error('Up to now there is no way to unregister routes');
                    return this;
                },
                startHistory: function (module) {
                    module.thenWith(this, function () {
                        if (!Backbone.History.started) {
                            Backbone.history.start(this.history);
                        }
                    });
                    return this;
                },
                stopHistory: function () {
                    if (Backbone.History.started) {
                        Backbone.history.stop();
                    }
                    return this;
                },
                navigate: function (module, path) {
                    var extra = _.rest(arguments, 2);
                    path = url(module.url, path);
                    this.router.navigate.apply(this.router, [path].concat(extra));
                    return this;
                },
                route: function (module, path, name, callback) {
                    var original;
                    path = url(module.url, path);
                    if (typeof name === 'function' || !callback) {
                        callback = name;
                        name = '';
                    }
                    original = callback;
                    callback = function fossilRouting() {
                        var eventName, method;
                        var args = arguments;
                        if (typeof original === 'string' && typeof module[original] === 'function') {
                            method = module[original];
                            original = method;
                        } else if (typeof original === 'string' && typeof original !== 'function') {
                            eventName = original;
                            original = _.bind(module.trigger, module, eventName);
                        }
                        if (!module.run) {
                            module.start();
                        }
                        module.then(function () {
                            original.apply(module, args);
                        });
                    };
                    this.router.route.call(this.router, path, name, callback);
                    return this;
                }
            });
        function url() {
            var parts = _.toArray(arguments);
            parts = _.reduce(parts, function (accumulator, part) {
                if (part) {
                    accumulator.push(cleanFragment(part, !accumulator.length));
                }
                return accumulator;
            }, []);
            return parts.join('/');
        }
        var cleanFirstReg = new RegExp('^(.*[^/]+)/*$');
        var cleanReg = new RegExp('^/*([^/]*.*[^/]+)/*$');
        function cleanFragment(fragment, first) {
            if (first) {
                return fragment.match(cleanFirstReg)[1];
            }
            return fragment.match(cleanReg)[1];
        }
        return Routing;
    }(underscore, backbone, utils, service);
var services_events = function (_, Service) {
        
        var Events = Service.extend({
                useDeep: true,
                initialize: function () {
                    _.bindAll(this, 'handle');
                },
                use: function (module, parent) {
                    module.addEventModifier('app', this.handle, [
                        'on',
                        'off',
                        'once',
                        'trigger'
                    ]);
                },
                dispose: function (module, parent) {
                    module.removeEventModifier('app');
                },
                handle: function (obj, method, eventname, args) {
                    return this[method].apply(this, [eventname].concat(args));
                }
            });
        return Events;
    }(underscore, service);
var services_template = function (_, utils, Service) {
        
        var Template = Service.extend({
                engine: null,
                useDeep: true,
                constructor: function (options) {
                    utils.copyOption(['engine'], this, options);
                    Service.apply(this, arguments);
                    _.bindAll(this, 'doViewRender', 'helper');
                    if (this.engine) {
                        this.engine.start();
                    }
                },
                use: function (module, parent) {
                    utils.copyOption(['helpers'], module, module.options);
                    module.helpers || (module.helpers = {});
                    this.helper({}, module);
                    this.listenTo(module, 'do:view:render', this.doViewRender);
                    this.listenTo(module, 'do:register:helper', this.helper);
                },
                dispose: function (module, parent) {
                    this.stopListening(module, 'do:view:render', this.doViewRender);
                    this.stopListening(module, 'do:register:helper', this.helper);
                    module.helper = null;
                },
                helper: utils.keyValueOrObject(function (key, helper, obj) {
                    obj || (obj = this);
                    obj.helpers || (obj.helpers = {});
                    obj.helpers[key] = helper;
                    return this;
                }),
                doViewRender: function (module, view) {
                    var helpers = this.getHelpers(module, view);
                    var globals = this.getExtraData(module, view);
                    this.engine.render(view, helpers, globals);
                },
                getHelpers: function (module, view) {
                    return _.extend({}, this.helpers, module.helpers, view.helpers || {});
                },
                getExtraData: function (module, view) {
                    return {
                        view: view,
                        module: module
                    };
                }
            });
        return Template;
    }(underscore, utils, service);
var engines_handlebars = function (_, Backbone, Handlebars, Mixin, Observable, Deferrable, Startable) {
        
        var ViewExtension = {
                precompile: function (template) {
                    if (typeof template === 'string') {
                        return Handlebars.compile(template);
                    }
                    return template;
                },
                renderHtml: function (data, extra) {
                    return this.template(data, extra);
                }
            };
        var Engine = Mixin.extend({
                _firstStart: function () {
                    _.defaults(Backbone.View.prototype, ViewExtension);
                    Startable._firstStart.apply(this, arguments);
                },
                _doStop: function () {
                    _.each(ViewExtension, function unmix(method, name) {
                        if (Backbone.View.prototype[name] === method) {
                            Backbone.View.prototype[name] = null;
                        }
                    });
                },
                render: function (view, helpers, data) {
                    var extra = {
                            helpers: helpers,
                            data: data
                        };
                    return view.render(extra);
                }
            });
        Engine.mix([
            Observable,
            Deferrable,
            Startable
        ]);
        return Engine;
    }(underscore, backbone, handlebars, mixin, mixins_observable, mixins_deferrable, mixins_startable);
var engines_underscore = function (_, Backbone, Mixin, Observable, Deferrable, Startable) {
        
        var ViewExtension = {
                precompile: function (template) {
                    if (typeof template === 'string') {
                        return _.template(template);
                    }
                    return template;
                },
                renderHtml: function (data, extra) {
                    return this.template(_.defaults(data, extra));
                }
            };
        var Engine = Mixin.extend({
                _firstStart: function () {
                    _.defaults(Backbone.View.prototype, ViewExtension);
                    Startable._firstStart.apply(this, arguments);
                },
                _doStop: function () {
                    var engine = this.engine;
                    _.each(ViewExtension, function unmix(method, name) {
                        if (Backbone.View.prototype[name] === method) {
                            Backbone.View.prototype[name] = null;
                        }
                    });
                },
                render: function (view, helpers, data) {
                    var extraTpl, extra;
                    extraTpl = {
                        helpers: helpers,
                        data: data
                    };
                    _.each(helpers || {}, function (helper, key) {
                        helpers[key] = function () {
                            return helper.apply(this, _.toArray(arguments).concat([extraTpl]));
                        };
                    });
                    extra = _.extend({}, helpers || {}, data || {});
                    return view.render(extra);
                }
            });
        Engine.mix([
            Observable,
            Deferrable,
            Startable
        ]);
        return Engine;
    }(underscore, backbone, mixin, mixins_observable, mixins_deferrable, mixins_startable);
var fossil = function (deferred, utils, Mixin, Module, RegionModule, LazyModule, Service, ObservableBuffer, ViewStore, Observable, Startable, Deferrable, Session, Canvas, Routing, Events, Template, Underscore, Handlebars) {
        
        var Fossil = {
                utils: utils,
                Mixin: Mixin,
                mixins: {
                    Observable: Observable,
                    Startable: Startable,
                    Deferrable: Deferrable
                },
                Module: Module,
                modules: {
                    region: RegionModule,
                    lazy: LazyModule
                },
                Service: Service,
                services: {
                    Session: Session,
                    Canvas: Canvas,
                    Routing: Routing,
                    Events: Events,
                    Template: Template
                },
                engines: {
                    Underscore: Underscore,
                    Handlebars: Handlebars
                },
                ViewStore: ViewStore,
                ObservableBuffer: ObservableBuffer
            };
        return Fossil;
    }(deferred, utils, mixin, {}, modules_region, modules_lazy, service, observableBuffer, viewStore, mixins_observable, mixins_startable, mixins_deferrable, services_session, services_canvas, services_routing, services_events, services_template, engines_handlebars, engines_underscore);return fossil;})();