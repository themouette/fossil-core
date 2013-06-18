define([
    'chai',
    'fossil/events'
], function (chai, Events) {
    'use strict';

    describe('Fossil.Events', function () {

        var Observable = function (options) {
            this.options = options;
            this.registerEvents();
        };
        _.extend(Observable.prototype, Events);

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
});
