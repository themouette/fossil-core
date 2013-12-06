define([
    'assert', 'sinon', 'underscore', 'fossil/mixin', 'fossil/mixins/deferrable', 'fossil/deferred'
],function (assert, sinon, _, Mixin, Deferrable, Deferred) {
    'use strict';
    var TIMEOUT = 20;

    suite('Fossil.Mixins.Deferrable', function () {
        var Queue = Mixin.extend();
        Queue.mix(Deferrable);

        test('implements fluent interface', function () {
            var q = new Queue();

            assert.strictEqual(q, q.waitFor(new Deferred()));
            assert.strictEqual(q, q.then());
            assert.strictEqual(q, q.thenWith());
            assert.strictEqual(q, q.abort());
        });

        suite('#waitFor()', function () {
            test('accepts raw values', function(done) {
                this.timeout(TIMEOUT);
                var q = new Queue();
                var value = 10;
                q.waitFor(value);

                q.then(function (promise) {
                    done();
                });
            });
            test('should be possible to give no options', function(done) {
                this.timeout(TIMEOUT);
                var q = new Queue();
                var d = new Deferred();
                q.waitFor(d);

                q.then(function () {
                    done();
                });

                d.resolve();
            });
            test('should be possible to add parallel promises', function(done) {
                this.timeout(TIMEOUT);
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
            test('accepts failFast=true', function (done) {
                this.timeout(TIMEOUT);
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
            test('accepts failFast=false', function () {
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
            test('failFast=false triggers error if any is rejected', function (done) {
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
            test('accepts timeout', function (done) {
                this.timeout(TIMEOUT);
                var q = new Queue();
                var d1 = new Deferred();
                q.waitFor(d1, {timeout: 2});
                q.then(
                    function () { assert.ok(false, 'no success here'); },
                    function () { done(); }
                );
            });
        });

        suite('#then()', function () {
            test('can be used in synchronous mode', function() {
                var value = 0;
                var q = new Queue();
                q.then(function () { value = 1; });

                assert.equal(value, 1);
            });
            test('synchronous mode calls success and always', function() {
                var calls = 0;
                var q = new Queue();
                q.then(
                    function () { calls++; },
                    function () { assert.ok(false, 'this should not be called'); },
                    function () { calls++; }
                );

                assert.equal(calls, 2);
            });
            test('calls error and always callback when rejected', function() {
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
            test('calls success and always callback when resolved', function() {
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
            suite('should forward arguments', function() {
                var module, d, success, error, always;
                setup(function() {
                    success = sinon.spy();
                    error = sinon.spy();
                    always = sinon.spy();
                    module = new Queue();
                    d = new Deferred();
                    module.waitFor(d);
                    module.then(success, error, always);
                });
                test('should tigger success and always on success', function (done) {
                    d.resolve('foo');

                    // ensure promise is fully resolved
                    module.then(function () {
                        assert.ok(success.calledWith('foo'), 'should call success with arguments');

                        assert.ok(always.calledWith('foo'), 'should call always');

                        assert.notOk(error.called, 'should NOT call error');
                        done();
                    });
                });
                test('should trigger error and always on error', function (done) {
                    d.reject('foo');

                    // ensure promise is fully resolved
                    module.then(function () {
                        assert.ok(error.calledWith('foo'), 'should call error with arguments');

                        assert.ok(always.calledWith('foo'), 'should call always');

                        done();
                    });
                });
            });
        });

        suite('#thenWith()', function () {
            test('can be used in synchronous mode', function() {
                var value = 0;
                var q = new Queue();
                var q2 = new Queue();
                q.thenWith(q2, function () {
                    value = 1;
                    assert.equal(this, q2);
                });

                assert.equal(value, 1);
            });
            test('synchronous mode calls success and always', function() {
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
            test('when rejected error is called', function() {
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
            test('when resolved success and always are called', function() {
                var calls = 0;
                var q = new Queue();
                var q2 = new Queue();
                var d = new Deferred();
                q.waitFor(d);
                q.thenWith(
                    q2,
                    function (foo) {
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

                d.resolve('foo');
                assert.equal(calls, 2);
            });
        });

        suite('#abort()', function () {
            test('should be possible to abort', function (done) {
                this.timeout(TIMEOUT);
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
            test('should be possible to abort whe not waiting', function() {
                var q = new Queue();
                q.abort();
            });
            test('When aborted, deferred resolution does not trigger callbacks', function (done) {
                this.timeout(TIMEOUT);
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
            test('calls deferred abort method if any.', function(done) {
                this.timeout(TIMEOUT);
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

        suite('multiple queues', function () {
            test('should be possible to create a new async after first one is aborted', function (done) {
                this.timeout(TIMEOUT);
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
            test('should be possible to create a new async after first one is complete', function (done) {
                this.timeout(TIMEOUT);
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
