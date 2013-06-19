define([
    "chai",
    "underscore",
    "fossil/deferred",
    "fossil/core",
    "fossil/mixins/observable",
    "fossil/mixins/deferrable",
    "fossil/mixins/startable",
], function (chai, _, Deferred, Fossil) {

    var assert = chai.assert;

    describe('Fossil.Mixins.Startable', function () {

        var Startable = function (){};
        _.extend(
            Startable.prototype,
            Fossil.Mixins.Observable,
            Fossil.Mixins.Deferrable,
            Fossil.Mixins.Startable, {
            _firstStart: function () {
                // do stuff
                Fossil.Mixins.Startable._firstStart.apply(this, arguments);
                // do stuff
            },
            _doStart: function () {
                // do stuff
                Fossil.Mixins.Startable._doStart.apply(this, arguments);
                // do stuff
            },
            _doStandby: function () {
                // do stuff
                Fossil.Mixins.Startable._doStandby.apply(this, arguments);
                // do stuff
            },
            _doStop: function () {
                // do stuff
                Fossil.Mixins.Startable._doStop.apply(this, arguments);
                // do stuff
            }
        });

        describe('start event', function () {
            it('should trigger start:first and start on first start', function (done) {
                done = _.after(2, done);
                this.timeout(10);
                var startable = new Startable();

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
            it('should trigger start:first on first start only', function (done) {
                this.timeout(10);
                var startable = new Startable();

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
            it('should not start again if already started', function() {
                var startable = new Startable();

                startable.start();

                startable.on('start', function () {assert.ok(false, 'already started !');});

                startable.start();
            });
            it('start:first is deferrable', function() {
                var startable = new Startable();
                var d = new Deferred();
                var calls = 0;

                startable.on('start:first', function (startable) {
                    startable.waitFor(d);
                    calls++;
                });
                startable.on('start', function (startable) {
                    calls++;
                });
                startable.start();
                // passed through start:first but don't go further until async is processed.
                assert.equal(calls, 1);
                d.resolve();
                // passed through start
                assert.equal(calls, 2);
            });
            it('should trigger start:first and start when previously stopped', function (done) {
                done = _.after(2, done);
                this.timeout(10);
                var startable = new Startable();

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
        });

        describe('standby event', function () {
            it('should not be triggered when not started', function() {
                var startable = new Startable();

                startable.on('standby', function () {
                    assert.ok(false, 'standby should not be called');
                });

                startable.standby();
            });
            it('should be triggered when previously started', function(done) {
                var startable = new Startable();

                startable.start();

                startable.on('standby', function () {
                    assert.ok(true, 'standby is called');
                    done();
                });

                startable.standby();
            });
            it('should not be triggered when already in standby', function() {
                var startable = new Startable();

                startable.start();
                startable.standby();

                startable.on('standby', function () {
                    assert.ok(false, 'standby should not be called');
                });

                startable.standby();
            });
        });

        describe('stop event', function () {
            it('should not be triggered when not started', function() {
                var startable = new Startable();

                startable.on('stop', function () {
                    assert.ok(false, 'stop should not be called');
                });

                startable.stop();
            });
            it('should be triggered when previously started', function(done) {
                var startable = new Startable();

                startable.start();

                startable.on('stop', function () {
                    assert.ok(true, 'stop is called');
                    done();
                });

                startable.stop();
            });
            it('should be triggered when in standby', function(done) {
                this.timeout(10);
                var startable = new Startable();

                startable.start();
                startable.standby();

                startable.on('stop', function () {
                    assert.ok(true, 'stop is called');
                    done();
                });

                startable.stop();
            });
            it('should not be triggered when already stopped', function() {
                var startable = new Startable();

                startable.start();
                startable.stop();

                startable.on('stop', function () {
                    assert.ok(false, 'stop should not be called');
                });

                startable.stop();
            });
            it('standby is deferrable', function() {
                var startable = new Startable();
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
