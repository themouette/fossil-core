define([
    "chai",
    "underscore",
    "fossil/mixins/deferrable",
    "fossil/deferred"
], function (chai, _, Deferrable, Deferred) {

    var assert = chai.assert;

    describe('Fossil.Mixins.Deferrable', function () {
        var Queue = function () {};
        _.extend(Queue.prototype, Deferrable);

        describe('Case async mode is started', function () {
            it('can start and resolve async mode', function(done) {
                this.timeout(10);
                var q = new Queue();
                q.deferred();
                q.then(function () {
                    done();
                });
                q.resolve();
            });
            it('can start and resolve async mode with promises', function(done) {
                this.timeout(10);
                var q = new Queue();
                var async = new Deferred();
                q.deferred();
                q.registerAsync(async);
                q.then(function () {
                    done();
                });
                q.resolve();
                async.resolve();
            });
            it('should be possible to attach callbacks on resolution', function(done) {
                this.timeout(10);
                var q = new Queue();
                var async = new Deferred();
                var testifier = 'immediate';
                q.deferred();
                q.registerAsync(async);
                q.then(function success() {
                    assert.equal(testifier, 'wait');
                    done();
                }, function failed(err) {
                    assert.ok(false);
                });
                q.resolve();
                testifier = 'wait';
                async.resolve();
            });
            it('should trigger error on reject', function(done) {
                this.timeout(10);
                var q = new Queue();
                var async = new Deferred();
                var testifier = 'immediate';
                q.deferred();
                q.registerAsync(async);
                q.then(function success() {
                    assert.ok(false);
                }, function failed(err) {
                    assert.equal(testifier, 'wait');
                    done();
                });
                q.resolve();
                testifier = 'wait';
                async.reject();
            });
            it('should be possible to resolve promises and then resolve the asyncable', function(done) {
                this.timeout(10);
                var q = new Queue();
                var async = new Deferred();
                var testifier = 'immediate';
                q.deferred();
                q.registerAsync(async);
                q.then(function success() {
                    assert.equal(testifier, 'wait');
                    done();
                }, function failed(err) {
                    assert.ok(false);
                });
                async.resolve();
                testifier = 'wait';
                q.resolve();
            });
            it('is resolved immediately when not in deferred mode.', function(done) {
                this.timeout(10);
                var q = new Queue();
                var async = new Deferred();
                var testifier = 'immediate';

                q.registerAsync(async);
                q.then(function (err) {
                    assert.equal(testifier, 'immediate');
                    done();
                });
                q.resolve();
                testifier = 'wait';
                async.resolve();
            });
            it('accepts a timeout', function (done) {
                this.timeout(10);
                var q = new Queue();
                var async = new Deferred();
                q.deferred(5);
                q.registerAsync(async);
                q.then(function success() {
                    assert.ok(false);
                }, function error (err) {
                    assert.ok(err, 'timeout triggers an error');
                    done();
                });
            });
        });

        describe('several calls to deferred', function () {
            it('can be deferred several time', function(done) {
                this.timeout(10);
                var q = new Queue();
                var tester = null;
                var async0 = new Deferred();
                var async1 = new Deferred();
                var async2 = new Deferred();
                q.deferred();
                q.registerAsync(async0);
                q.resolve();

                q.deferred();
                q.registerAsync(async1);
                q.resolve();

                q.deferred();
                q.registerAsync(async2);
                q.resolve();

                q.then(function success() {
                    assert.equal(tester, 2);
                    done();
                }, function error(err) {
                    assert.ok(false, err);
                });
                tester = 0;
                async0.resolve();
                tester = 1;
                async1.resolve();
                tester = 2;
                async2.resolve();
            });
        });
    });
});
