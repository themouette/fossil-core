define([
    'assert', 'sinon', 'underscore', 'fossil/mixin',
    'fossil/mixins/startable', 'fossil/mixins/observable', 'fossil/mixins/deferrable',
    'fossil/deferred'
],function (assert, sinon, _, Mixin, Startable, Observable, Deferrable, Deferred) {
    'use strict';

    suite('mixins/startable', function () {

        var Start = Mixin.extend({
            _firstStart: function () {
                // do stuff
                Startable._firstStart.apply(this, arguments);
                // do stuff
            },
            _doStart: function () {
                // do stuff
                Startable._doStart.apply(this, arguments);
                // do stuff
            },
            _doStandby: function () {
                // do stuff
                Startable._doStandby.apply(this, arguments);
                // do stuff
            },
            _doStop: function () {
                // do stuff
                Startable._doStop.apply(this, arguments);
                // do stuff
            }
        });
        Start.mix([Observable, Deferrable, Startable]);

        suite('start event', function () {
            test('should trigger start:first and start on first start', function (done) {
                done = _.after(2, done);
                this.timeout(10);
                var startable = new Start();

                startable.on('start:first', function () {
                    assert.ok(true, 'start:first is called on fist start');
                    done();
                });
                startable.on('start', function () {
                    assert.ok(true, 'start is called on fist start');
                    done();
                });

                startable.start();
            });
            test('should trigger start:first on first start only', function (done) {
                this.timeout(10);
                var startable = new Start();

                startable.start();
                startable.standby();

                startable.on('start:first', function () {
                    assert.ok(false, 'start:first is called on fist start');
                });
                startable.on('start', function () {
                    assert.ok(true, 'start is called on fist start');
                    done();
                });

                startable.start();
            });
            test('should not start again if already started', function() {
                var startable = new Start();

                startable.start();

                startable.on('start', function () {assert.ok(false, 'already started !');});

                startable.start();
            });
            test('start:first is deferrable', function() {
                var startable = new Start();
                var d = new Deferred();
                var calls = 0;

                startable.on('start:first', function (startable) {
                    startable.waitFor(d);
                    calls++;
                });
                startable.start();
                startable.then(function (startable) {
                    calls++;
                });
                // passed through start:first but don't go further until async is processed.
                assert.equal(calls, 1);
                d.resolve();
                // passed through start
                assert.equal(calls, 2);
            });
            test('should trigger start:first and start when previously stopped', function (done) {
                done = _.after(2, done);
                this.timeout(10);
                var startable = new Start();

                startable.start();
                startable.stop();

                startable.on('start:first', function () {
                    assert.ok(true, 'start:first is called on fist start');
                    done();
                });
                startable.on('start', function () {
                    assert.ok(true, 'start is called on fist start');
                    done();
                });

                startable.start();
            });
            test('should wait for the whole event to be processed before colling deferred', function () {
                var startable = new Start();
                var spy = sinon.spy();
                var d = new Deferred();

                startable.on('start:first', function () {
                    // register callback befor deferred
                    this.then(spy);
                });
                startable.on('start', function () {
                    this.waitFor(d);
                });

                startable.start();
                assert.ok(!spy.called, 'wait for deferred to be resolved');
                d.resolve(true);
                assert.ok(spy.called, 'calls on resolution');
            });
        });

        suite('standby event', function () {
            test('should not be triggered when not started', function() {
                var startable = new Start();

                startable.on('standby', function () {
                    assert.ok(false, 'standby should not be called');
                });

                startable.standby();
            });
            test('should be triggered when previously started', function(done) {
                var startable = new Start();

                startable.start();

                startable.on('standby', function () {
                    assert.ok(true, 'standby is called');
                    done();
                });

                startable.standby();
            });
            test('should not be triggered when already in standby', function() {
                var startable = new Start();

                startable.start();
                startable.standby();

                startable.on('standby', function () {
                    assert.ok(false, 'standby should not be called');
                });

                startable.standby();
            });
        });

        suite('stop event', function () {
            test('should not be triggered when not started', function() {
                var startable = new Start();

                startable.on('stop', function () {
                    assert.ok(false, 'stop should not be called');
                });

                startable.stop();
            });
            test('should be triggered when previously started', function(done) {
                var startable = new Start();

                startable.start();

                startable.on('stop', function () {
                    assert.ok(true, 'stop is called');
                    done();
                });

                startable.stop();
            });
            test('should be triggered when in standby', function(done) {
                this.timeout(10);
                var startable = new Start();

                startable.start();
                startable.standby();

                startable.on('stop', function () {
                    assert.ok(true, 'stop is called');
                    done();
                });

                startable.stop();
            });
            test('should not be triggered when already stopped', function() {
                var startable = new Start();

                startable.start();
                startable.stop();

                startable.on('stop', function () {
                    assert.ok(false, 'stop should not be called');
                });

                startable.stop();
            });
            test('standby is deferrable', function() {
                var startable = new Start();
                var d = new Deferred();
                var calls = 0;

                startable.on('standby', function (startable) {
                    startable.waitFor(d);
                    calls++;
                });
                startable.on('stop', function (startable) {
                    calls++;
                });
                startable.start();
                startable.stop();
                // passed through start:first but don't go further until async is processed.
                assert.equal(calls, 1);
                d.resolve();
                // passed through start
                assert.equal(calls, 2);
            });
        });
    });
});
