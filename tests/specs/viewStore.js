define([
    'assert', 'sinon', 'fossil/viewStore'
], function (assert, sinon, ViewStore) {
    "use strict";

    suite('ViewStore', function () {
        var store;
        setup(function () {
            store = new ViewStore();
        });
        suite('#set', function () {
            test('should store factory', function () {
                var factory = sinon.spy();
                store.set('foo', factory);

                assert.strictEqual(store.factories.foo, factory);
            });
        });
        suite('#get', function () {
            test('should return factory result', function () {
                var view = {a: 1, b: 2};
                var factory = sinon.stub().returns(view);
                store.set('foo', factory);

                assert.deepEqual(store.get('foo'), view);
            });
            test('should forward arguments to factory', function () {
                var factory = sinon.spy();
                store.set('foo', factory);

                store.get('foo', 'message', 123);

                assert.ok(factory.calledOnce);
                assert.ok(factory.calledWith('message', 123));
            });
            test('should not call factory twice for recycling views', function () {
                var factory = sinon.stub().returns({recycle: true});
                store.set('foo', factory);

                store.get('foo', 'message', 123);
                store.get('foo', 'message2', 1234);

                assert.ok(factory.calledOnce);
                assert.ok(factory.calledWith('message', 123));
            });
            test('should always call factory for non recycling views', function () {
                var factory = sinon.stub().returns({});
                store.set('foo', factory);

                store.get('foo', 'message', 123);
                store.get('foo', 'message2', 1234);

                assert.ok(factory.calledTwice);
                assert.ok(factory.calledWith('message', 123));
                assert.ok(factory.calledWith('message2', 1234));
            });
        });
        suite('#has', function () {
            test('should return true when factory exists', function () {
                var factory = sinon.stub();
                store.set('foo', factory);

                assert.ok(store.has('foo'));
            });
            test('should return false when factory does not exist', function () {
                assert.ok(!store.has('foo'));
            });
        });
        suite('#remove', function () {
            var spy;
            setup(function () {
                spy = sinon.spy();
                var factoryRecycle = sinon.stub().returns({remove: spy, recycle: true});
                var factoryDispose = sinon.stub().returns({remove: spy});
                store.set('recycle', factoryRecycle);
                store.set('disposable', factoryDispose);
            });
            test('should not call remove if view does not recycle', function () {
                store.get('dispose');
                store.remove('dispose');

                assert.ok(!spy.called);
            });
            test('should not call view.remove when factory was not called', function () {
                store.remove('recycle');

                assert.ok(!spy.called);
            });
            test('should call view.remove with force', function () {
                store.get('recycle');
                store.remove('recycle');

                assert.ok(spy.calledWith(true));
            });
        });
        suite('#clean', function () {
            var spy;
            setup(function () {
                spy = sinon.spy();
                var factory = sinon.stub().returns({remove: spy, recycle: true});
                store.set('foo', factory);
                store.set('bar', factory);
            });
            test('should remove all instanciated views', function () {
                store.get('foo');
                store.get('bar');

                store.clean();

                assert.ok(spy.callCount, 2);
                assert.ok(spy.calledWith(true));
            });
        });
    }); //end of main suite
});
