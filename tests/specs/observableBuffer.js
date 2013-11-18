define([
    'assert', 'sinon', 'underscore', 'fossil/mixin', 'fossil/mixins/observable', 'fossil/observableBuffer'
], function (assert, sinon, _, Mixin, Observable, ObservableBuffer) {
  "use strict";

    var Module = Mixin.extend().mix(Observable);
    var emptyFn = function () {};

    suite('ObservableBuffer', function () {
        var stub;
        setup(function () {
            stub = {};
        });
        suite('should store all calls and arguments', function () {
            test('#on', checkStore('on', 'eventname', emptyFn));
            test('#off', checkStore('off', 'eventname', emptyFn));
            test('#once', checkStore('once', 'eventname', emptyFn));
            test('#listenTo', checkStore('listenTo', stub, 'eventname', emptyFn));
            test('#listenToOnce', checkStore('listenToOnce', stub, 'eventname', emptyFn));
            test('#stopListening', checkStore('stopListening', stub, 'eventname', emptyFn));
            test('#trigger', checkStore('trigger', 'eventname', stub));
        });

        suite('should replay every event', function () {
            var stub;
            setup(function () {
                stub = new Module();
            });
            test('#on', testReplay('on', 'eventname', emptyFn));
            test('#off', testReplay('off', 'eventname', emptyFn));
            test('#once', testReplay('once', 'eventname', emptyFn));
            test('#listenTo', testReplay('listenTo', stub, 'eventname', emptyFn));
            test('#listenToOnce', testReplay('listenToOnce', stub, 'eventname', emptyFn));
            test('#stopListening', testReplay('stopListening', stub, 'eventname', emptyFn));
            test('#trigger', testReplay('trigger', 'eventname', stub));
        });

        suite('should replace the this argument with observable', function () {
            test('#on', testReplace('on'));
            test('#off', testReplace('off'));
            test('#once', testReplace('once'));
        });

        function checkStore(method) {
            var extra = _.rest(arguments);
            return function () {
                var buffer = new ObservableBuffer();

                buffer[method].apply(buffer, extra);

                assert.equal(buffer.store.length, 1);
                assert.deepEqual(buffer.store[0], [method, extra]);
            };
        }

        function testReplay(method) {
            var extra = _.rest(arguments);
            return function () {
                var spy = sinon.spy();
                var buffer = new ObservableBuffer();
                var module = new Module();
                // replace observable's method with spy
                module[method] = spy;

                // call method on buffer
                buffer[method].apply(buffer, extra);

                assert.ok(!spy.called, 'should wait for replay');

                // replay on module
                buffer.replay(module);

                assert.ok(spy.calledOnce, 'should call once');
                assert.ok(spy.calledOn(module), 'should keep context');
                assert.ok(spy.calledWith.apply(spy, extra), 'should pass arguments');
            };
        }

        function testReplace(method) {
            return function () {
                var spy = sinon.spy();
                var buffer = new ObservableBuffer();
                var module = new Module();
                // replace observable's method with spy
                module[method] = spy;

                buffer[method]('eventname', emptyFn, buffer, 'a');

                // replay on module
                buffer.replay(module);

                assert.ok(spy.calledOnce, 'should call once');
                assert.ok(spy.calledOn(module), 'should keep context');
                assert.ok(spy.calledWith('eventname', emptyFn, module, 'a'), 'should pass arguments');
            };
        }
    }); // end of suite ObservableBuffer

});
