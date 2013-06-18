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

        it('implements fluent interface', function () {
            var q = new Queue();

            assert.strictEqual(q, q.waitFor(new Deferred()));
            assert.strictEqual(q, q.then());
            assert.strictEqual(q, q.thenWith());
            assert.strictEqual(q, q.abort());
        });

        describe('waitFor method', function () {
            it('should be possible to give no options', function(done) {
                this.timeout(10);
                var q = new Queue();
                var d = new Deferred();
                q.waitFor(d);

                q.then(function () {
                    done();
                });

                d.resolve();
            });
            it('should be possible to add parallel promises', function(done) {
                this.timeout(10);
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();
                var calls = 0;

                q.waitFor(d1);
                q.waitFor(d2);

                q.then(function () {
                    assert.equal(calls, 2);
                    done();
                });

                calls++;
                d1.resolve();
                calls++;
                d2.resolve();
            });
            it('accepts failFast=true', function (done) {
                this.timeout(10);
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();
                q.waitFor(d1, {failFast:true});
                q.waitFor(d2, {failFast:true});

                q.then(
                    function () { assert.ok(false, 'no success here'); },
                    function () { done(); }
                );

                d2.reject();
            });
            it('accepts failFast=false', function () {
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();
                q.waitFor(d1, {failFast:false});
                q.waitFor(d2, {failFast:false});

                q.then(
                    function () { assert.ok(false, 'no success here'); },
                    function () { assert.ok(false, 'no error here'); }
                );

                d2.reject();
            });
            it('failFast=false triggers error if any is rejected', function (done) {
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();
                q.waitFor(d1, {failFast:false});
                q.waitFor(d2, {failFast:false});

                q.then(
                    function () { assert.ok(false, 'no success here'); },
                    function () { done(); }
                );

                d1.reject();
                d2.resolve();
            });
            it('accepts timeout', function (done) {
                this.timeout(10);
                var q = new Queue();
                var d1 = new Deferred();
                q.waitFor(d1, {timeout: 2});
                q.then(
                    function () { assert.ok(false, 'no success here'); },
                    function () { done(); }
                );
            });
        });

        describe('then method', function () {
            it('can be used in synchronous mode', function() {
                var value = 0;
                var q = new Queue();
                q.then(function () { value = 1; });

                assert.equal(value, 1);
            });
            it('synchronous mode calls success and always', function() {
                var calls = 0;
                var q = new Queue();
                q.then(
                    function () { calls++; },
                    function () { assert.ok(false, 'this should not be called'); },
                    function () { calls++; }
                );

                assert.equal(calls, 2);
            });
            it('calls error and always callback when rejected', function() {
                var calls = 0;
                var message = "this is an error";
                var q = new Queue();
                var d = new Deferred();
                q.waitFor(d);
                q.then(
                    function () { assert.ok(false, 'success should not be called'); },
                    function (error) { assert.equal(error, message); calls++; },
                    function () { calls++; }
                );

                d.reject(message);
                assert.equal(calls, 2);
            });
            it('calls success and always callback when resolved', function() {
                var calls = 0;
                var message = "this is an error";
                var q = new Queue();
                var d = new Deferred();
                q.waitFor(d);
                q.then(
                    function () { calls++; },
                    function () { assert.ok(false, 'success should not be called'); },
                    function () { calls++; }
                );

                d.resolve();
                assert.equal(calls, 2);
            });
        });

        describe('thenWith method', function () {
            it('can be used in synchronous mode', function() {
                var value = 0;
                var q = new Queue();
                var q2 = new Queue();
                q.thenWith(q2, function () {
                    value = 1;
                    assert.equal(this, q2);
                });

                assert.equal(value, 1);
            });
            it('synchronous mode calls success and always', function() {
                var calls = 0;
                var q = new Queue();
                var q2 = new Queue();
                q.thenWith(
                    q2,
                    function () {
                        calls++;
                        assert.equal(this, q2);
                    },
                    function () {
                        assert.ok(false, 'this should not be called');
                    },
                    function () {
                        calls++;
                        assert.equal(this, q2);
                    }
                );

                assert.equal(calls, 2);
            });
            it('when rejected error is called', function() {
                var calls = 0;
                var message = "this is an error";
                var q = new Queue();
                var q2 = new Queue();
                var d = new Deferred();
                q.waitFor(d);
                q.thenWith(
                    q2,
                    function () {
                        assert.ok(false, 'success should not be called');
                    },
                    function (error) {
                        calls++;
                        assert.equal(error, message);
                        assert.equal(this, q2);
                    },
                    function () {
                        calls++;
                        assert.equal(this, q2);
                    }
                );

                d.reject(message);
                assert.equal(calls, 2);
            });
            it('when resolved success and always are called', function() {
                var calls = 0;
                var q = new Queue();
                var q2 = new Queue();
                var d = new Deferred();
                q.waitFor(d);
                q.thenWith(
                    q2,
                    function () {
                        calls++;
                        assert.equal(this, q2);
                    },
                    function () {
                        assert.ok(false, 'success should not be called');
                    },
                    function () {
                        calls++;
                        assert.equal(this, q2);
                    }
                );

                d.resolve();
                assert.equal(calls, 2);
            });
        });

        describe('abort method', function () {
            it('should be possible to abort', function (done) {
                this.timeout(10);
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();
                var calls = 0;

                q.waitFor(d1);
                q.waitFor(d2);

                q.then(
                    function () { assert.ok(false, 'no success called on abort'); },
                    function (error) { done(); }
                );

                q.abort();
            });
            it('When aborted, deferred resolution does not trigger callbacks', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();
                var calls = 0;

                q.waitFor(d1);
                q.waitFor(d2);

                q.then(
                    function () { assert.ok(false, 'no success called on abort'); },
                    function (error) { done(); }
                );

                q.abort();
                d1.resolve();
                d2.resolve();
                done();
            });
            it('calls deferred abort method if any.', function(done) {
                this.timeout(10);
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();
                d1.abort = function () {
                    done();
                };
                var calls = 0;

                q.waitFor(d1);
                q.waitFor(d2);

                q.abort();
            });
        });

        describe('multiple queues', function () {
            it('should be possible to create a new async after first one is aborted', function (done) {
                this.timeout(10);
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();

                q.waitFor(d1);

                q.then(
                    function () { assert.ok(false, 'no success called'); }
                );

                q.abort();

                q.waitFor(d2);
                q.then(function () {done();});
                d2.resolve();
            });
            it('should be possible to create a new async after first one is complete', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var q = new Queue();
                var d1 = new Deferred();
                var d2 = new Deferred();

                q.waitFor(d1);

                q.then(
                    function () { done(); },
                    function () { assert.ok(false, 'no success called'); }
                );

                d1.resolve();

                q.waitFor(d2);
                q.then(
                    function () { assert.ok(false, 'no success called'); },
                    function () {done();}
                );
                d2.reject();
            });
        });
    });
});
