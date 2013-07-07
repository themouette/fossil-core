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
