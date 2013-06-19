define([
    'chai',
    'fossil/mixins/observable'
], function (chai, Eventable) {
    'use strict';

    var assert = chai.assert;

    describe('Fossil.Mixins.Observable', function () {

        var Observable = function (options) {
            this.options = options;
            this.registerEvents();
        };
        _.extend(Observable.prototype, Eventable);

        describe('Init methods', function () {

            it('should accept prototype events', function (done) {
                this.timeout(10);
                var Obj = function (options) {
                    Observable.call(this, options);
                };

                _.extend(Obj.prototype, Observable.prototype, {
                    events: {
                        foo: done
                    }
                });

                var o = new Obj();

                o.trigger('foo');
            });

            it('should accept options events', function (done) {
                this.timeout(10);

                var o = new Observable({
                    events: {
                        foo: done
                    }
                });

                o.trigger('foo');
            });
            it('should override prototype events with options events', function (done) {
                this.timeout(10);
                var Obj = function (options) {
                    Observable.call(this, options);
                };

                _.extend(Obj.prototype, Observable.prototype, {
                    events: {
                        foo: function () {
                            assert.ok(false, 'This should be overriden');
                        }
                    }
                });

                var o = new Obj({
                    events: {
                        foo: done
                    }
                });

                o.trigger('foo');
            });
        });

        describe('create pubsub', function () {
            it('should be possible to expose pubsub', function(done) {
                this.timeout(20);
                done = _.after(2, done);

                var parent = new Observable();
                var o;

                var Obj = function (options) {
                    Observable.call(this, options);
                };
                _.extend(Obj.prototype, Observable.prototype, {
                    parentEvents: {
                        foo: 'mymethod',
                        bar: function () {
                            assert.ok(false, 'This should be overriden');
                        }
                    },
                    mymethod: function () {
                        assert.strictEqual(this, o);
                        done();
                    }
                });

                o = new Obj({
                    parentEvents: {
                        bar: function () {
                            assert.strictEqual(this, o);
                            done();
                        }
                    }
                });

                var pubsub = parent.createPubSub(o, 'parentEvents');

                pubsub.trigger('foo');
                pubsub.trigger('bar');
            });
        });
    });
});
