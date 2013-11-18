define(['sinon', 'assert', 'fossil/mixin'], function (sinon, assert, Mixin) {
  "use strict";

    suite('Mixin', function () {

        suite('#extend()', function () {
            var Child, spy;
            setup(function () {
                spy = sinon.spy();
                Child = Mixin.extend({
                    'foo': spy
                });
            });

            test('should create a new class', function () {
                var child = new Child();
                var mixin = new Mixin();

                assert.isFunction(child.foo);
                assert.isUndefined(mixin.foo);
            });

            test('should extend with given properties', function () {
                var child = new Child();
                var mixin = new Mixin();

                child.foo();
                assert.ok(spy.calledOnce);
            });
        }); // end of #extend suite

        suite('#mix()', function () {
            var Child, spy;
            setup(function () {
                spy = sinon.spy();
                Child = Mixin.extend({
                    'foo': spy
                });
            });

            test('should extend current class', function () {
                Child.mix({
                    bar: spy
                });
                var child = new Child();
                var mixin = new Mixin();

                assert.isFunction(child.bar);
                assert.isUndefined(mixin.bar);
            });

            test('should not replace existing properties', function () {
                var spy2 = sinon.spy();
                Child.mix({
                    foo: spy2
                });
                var child = new Child();

                assert.equal(child.foo, spy);
            });

            test('should hook in initialize', function () {
                var spy2 = sinon.spy();
                Child.mix({
                    initialize: spy2
                });
                var child = new Child();

                assert.ok(spy2.calledOnce);
            });
        }); // end of #mixin suite

        suite('#unmix()', function () {
            var Child, spy;
            setup(function () {
                spy = sinon.spy();
                Child = Mixin.extend({
                    'foo': spy
                });
            });

            test('should remove mixin methods', function () {
                var spy2 = sinon.spy();
                var mix = {
                    bar: spy2
                };

                Child.mix(mix);
                Child.unmix(mix);
                var child = new Child();

                assert.isUndefined(child.bar);
            });

            test('should not remove non mixin methods with same name', function () {
                var spy2 = sinon.spy();
                var mix = {
                    foo: spy2
                };
                Child.mix(mix);
                Child.unmix(mix);
                var child = new Child();

                assert.equal(child.foo, spy);
            });
        });
    });
});
