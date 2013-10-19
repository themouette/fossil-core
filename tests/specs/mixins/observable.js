define([
    'assert', 'fossil/mixin', 'fossil/mixins/observable'
], function (assert, Mixin, Observable) {
    'use strict';

    suite('mixins/observable', function () {

        var Events = Mixin.extend({
            constructor: function (options) {
                this.options = options;
                Mixin.call(this, options);
            }
        });
        Events.mix(Observable);

        suite('Init methods', function () {

            test('should accept prototype events', function (done) {
                this.timeout(10);
                var Obj = Events.extend({
                    events: {
                        foo: done
                    }
                });

                var o = new Obj();

                o.trigger('foo');
            });

            test('should accept options events', function (done) {
                this.timeout(10);

                var o = new Events({
                    events: {
                        foo: done
                    }
                });

                o.trigger('foo');
            });
            test('should override prototype events with options events', function (done) {
                this.timeout(10);
                var Obj = Events.extend({
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

        suite('create pubsub', function () {
            test('should be possible to expose pubsub', function(done) {
                this.timeout(20);
                done = _.after(2, done);

                var parent = new Events();
                var o;

                var Obj = Events.extend({
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

        suite('#forward()', function () {
            var observable, spy;
            setup(function () {
                observable = new Events();
                spy = sinon.spy();
                observable.on('dest', spy);
                observable.forward('src', 'dest');
            });
            test('forward event', function (done) {
                observable.on('dest', function () {done();});
                observable.trigger('src');

                assert.ok(spy.calledOnce);
            });
            test('forward event params', function (done) {
                observable.on('dest', function () {done();});
                observable.trigger('src', 1, 'foo');

                assert.ok(spy.calledOnce, 'call');
                assert.ok(spy.calledWith(1, 'foo'), 'args');
            });
        });

        suite('event matchers', function () {
            var observable, spy;
            setup(function () {
                observable = new Events();
                spy = sinon.spy();
            });
            suite('map!', function () {
                test('should return an array', function () {
                    assert.isArray(observable.trigger('map!foo'));
                });
                test('should return handlers results', function () {
                    observable.on('foo', sinon.stub().returns(1));
                    observable.on('foo', sinon.stub().returns(2));
                    observable.on('foo', sinon.stub().returns(3));

                    assert.deepEqual(observable.trigger('map!foo'), [1,2,3]);
                });
            });
            suite('one!', function () {
                test('should return null if no listener', function () {
                    assert.isNull(observable.trigger('one!foo'));
                });
                test('should return handlers results', function () {
                    observable.on('foo', sinon.stub().returns(1));
                    observable.on('foo', sinon.stub().returns(2));
                    observable.on('foo', sinon.stub().returns(3));

                    assert.equal(observable.trigger('one!foo'), 1);
                });
            });
        });
    });
});
