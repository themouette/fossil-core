(function (assert, Observable) {
    'use strict';

    describe('Fossil.Mixins.Observable', function () {

        var Events = function (options) {
            this.options = options;
            this.registerEvents();
        };
        _.extend(Events.prototype, Observable);

        describe('Init methods', function () {

            it('should accept prototype events', function (done) {
                this.timeout(10);
                var Obj = function (options) {
                    Events.call(this, options);
                };

                _.extend(Obj.prototype, Events.prototype, {
                    events: {
                        foo: done
                    }
                });

                var o = new Obj();

                o.trigger('foo');
            });

            it('should accept options events', function (done) {
                this.timeout(10);

                var o = new Events({
                    events: {
                        foo: done
                    }
                });

                o.trigger('foo');
            });
            it('should override prototype events with options events', function (done) {
                this.timeout(10);
                var Obj = function (options) {
                    Events.call(this, options);
                };

                _.extend(Obj.prototype, Events.prototype, {
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

                var parent = new Events();
                var o;

                var Obj = function (options) {
                    Events.call(this, options);
                };
                _.extend(Obj.prototype, Events.prototype, {
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
})(chai.assert, Fossil.Mixins.Observable);
