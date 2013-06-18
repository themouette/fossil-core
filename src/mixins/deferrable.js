define([
    'fossil/core',
    'fossil/deferred'
], function (Fossil, Deferred) {
    'use strict';
    var messages = {
        timeout: 'async process timed out',
        rejected: 'some asynchronous process failed'
    };

    var Deferrable = Fossil.Mixins.Deferrable = {
        async: null,
        deferred: function (timeout) {
            if (this.hasAsync()) {
                this.async.count++;
                return this;
            }
            this.async = {
                deferred: new Deferred(),
                promises: [],
                count: 1
            };
            if (0 !== timeout) {
                this.async.timeout = setTimeout(_.bind(function () {
                        this.async.deferred.reject(new Error(messages.timeout));
                        this.async.count = 0;
                    }, this), timeout || 1000);
            }
            return this;
        },
        then: function (success, error, always) {
            if (!this.hasAsync()) {
                success();
                return this;
            }
            if (success) {
                this.async.deferred.done(success);
            }
            if (error) {
                this.async.deferred.fail(error);
            }
            if (always) {
                this.async.deferred.always(always);
            }
            return this;
        },
        resolve: function () {
            if (!this.hasAsync()) {
                return this;
            }

            if (--this.async.count > 0) {
                return;
            }

            var processed = _.every(this.async.promises, function (p) {
                return "pending" !== p.state();
            });
            if (!processed) {
                return this;
            }
            var failed = _.any(this.async.promises, function (p) {
                return "resolved" !== p.state();
            });
            if (failed) {
                this.async.deferred.reject(new Error(messages.failed), this.async.promises);
            } else {
                this.async.deferred.resolve(this.async.promises);
            }
            this._resetDeferred();
            return this;
        },
        registerAsync: function (promise) {
            if (!this.hasAsync()) {
                return this;
            }
            this.async.count++;
            this.async.promises.push(promise);
            if (promise.always) {
                promise.always(_.bind(this.resolve, this, true));
            }
        },
        hasAsync: function () {
            return  !!this.async &&
                    !!this.async.deferred &&
                    "pending" === this.async.deferred.state();
        },
        _resetDeferred: function () {
            if (!this.hasAsync()) {
                return this;
            }
            if (this.async.timeout) {
                clearTimeout(this.async.timeout);
            }
        }
    };

    return Deferrable;
});
