define([
    'chai',
    'fossil/events'
], function (chai, Events) {
    'use strict';

    var assert = chai.assert;

    describe('Fossil.Events', function () {

        var Observable = function (options) {
            this.options = options;
            this.registerEvents();
        };
        _.extend(Observable.prototype, Events);

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

        describe('it is possible to expose pubsub', function () {
            it('should be possible to expose pubsub', function(done) {
                this.timeout(10);
                done = _.after(2, done);

                var parent = new Observable();

                var Obj = function (options) {
                    Observable.call(this, options);
                };
                _.extend(Obj.prototype, Observable.prototype, {
                    parentEvents: {
                        foo: done,
                        bar: function () {
                            assert.ok(false, 'This should be overriden');
                        }
                    }
                });

                var o = new Obj({
                    parentEvents: {
                        bar: done
                    }
                });

                var pubsub = parent.createPubSub(o, 'parentEvents');

                pubsub.trigger('foo');
                pubsub.trigger('bar');
            });
        });
    });
});
