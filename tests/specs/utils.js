define(['assert', 'sinon', 'fossil/utils'], function (assert, sinon, utils) {

    suite('utils', function () {

        suite('#scalarOrArray', function () {
            var spy, method;

            setup(function () {
                spy = sinon.spy();
                method = utils.scalarOrArray(spy);
            });

            test('should accept array argument', function () {
                method(['foo', 'bar', 'baz'], 'extra');

                assert.equal(spy.callCount, 3);
                assert.ok(spy.calledWith('foo', 'extra'));
                assert.ok(spy.calledWith('bar', 'extra'));
                assert.ok(spy.calledWith('baz', 'extra'));
            });

            test('should accept scalar argument', function () {
                method('foo', 'extra');

                assert.ok(spy.calledOnce);
                assert.ok(spy.calledWith('foo', 'extra'));
            });

            test('should preserve this argument', function () {
                var obj = {
                    bar: utils.scalarOrArray(function () {
                        assert.strictEqual(this, obj);
                    })
                };

                obj.bar([1, 2]);
            });
        });

        suite('#keyValueOrObject', function () {
            var spy, method;

            setup(function () {
                spy = sinon.spy();
                method = utils.keyValueOrObject(spy);
            });

            test('should accept object argument', function () {
                method({
                    'foo': 1,
                    'bar': 2,
                    'baz': 3
                }, 'extra');

                assert.equal(spy.callCount, 3, 'method has been called 3 times');
                assert.ok(spy.calledWith('foo', 1, 'extra'));
                assert.ok(spy.calledWith('bar', 2, 'extra'));
                assert.ok(spy.calledWith('baz', 3, 'extra'));
            });

            test('should accept scalar argument', function () {
                method('foo', 1, 'extra');

                assert.ok(spy.calledOnce);
                assert.ok(spy.calledWith('foo', 1, 'extra'));
            });

            test('should preserve this argument', function () {
                var obj = {
                    bar: utils.keyValueOrObject(function () {
                        assert.strictEqual(this, obj);
                    })
                };

                obj.bar({a: 1, b: 2});
            });
        });

        suite('#copyOption()', function () {

            test('should copy a non existing option', function () {
                var ctx = {};
                var options = {prop: 'something'};

                utils.copyOption('prop', ctx, options);

                assert.equal(ctx.prop, options.prop);
            });

            test('should overwrite existing option', function () {
                var ctx = {prop: 'other'};
                var options = {prop: 'something'};

                utils.copyOption('prop', ctx, options);

                assert.equal(ctx.prop, options.prop);
            });

            test('should not copy undefined option', function () {
                var ctx = {};
                var options = {};

                utils.copyOption('prop', ctx, options);

                assert.isUndefined(ctx.prop);
            });

            test('should not overwrite with undefined option', function () {
                var ctx = {prop: 'other'};
                var options = {};

                utils.copyOption('prop', ctx, options);

                assert.equal(ctx.prop, 'other');
            });

            test('should accept undefined options', function () {
                var ctx = {prop: 'other'};
                var options;

                utils.copyOption('prop', ctx, options);

                assert.equal(ctx.prop, 'other');
            });
        }); // end for #copyOption suite

        suite('#getProperty', function () {
            var src;

            setup(function () {
                src = {
                    a: {
                        b: {
                            c: 'foo'
                        }
                    },
                    d: 'bar'
                };
            });

            test('should read a top level property', function () {
                var d = utils.getProperty('d', src);

                assert.equal(d, src.d);
            });

            test('should read nested property', function () {
                var b = utils.getProperty('a.b', src);

                assert.deepEqual(b, src.a.b);
            });

            test('should deeply nested property', function () {
                var c = utils.getProperty('a.b.c', src);

                assert.deepEqual(c, src.a.b.c);
            });

            test('should return default value if property is undefined', function () {
                var e = utils.getProperty('e', src, 'default');
                var f = utils.getProperty('a.f', src, 'nested');
                var g = utils.getProperty('a.f.g', src, 'deep');

                assert.equal(e, 'default', 'top level property');
                assert.equal(f, 'nested', 'nested property');
                assert.equal(g, 'deep', 'deep nested property');
            });

            test('should return default if object is undefined', function () {
                var src;
                var d = utils.getProperty('d', src, 'default');

                assert.equal(d, 'default');
            });
        }); // end for #getProperty suite

        suite('#setProperty', function () {
            var src;

            setup(function () {
                src = {
                    a: {
                        b: {
                            c: 'foo'
                        }
                    },
                    d: 'bar',
                    'bool': true
                };
            });

            test('should replace existing top-level property', function () {
                utils.setProperty('d', 'new value', src);

                assert.equal(src.d, 'new value');
            });

            test('should replace existing nested property', function () {
                utils.setProperty('a.b', 'new value', src);

                assert.equal(src.a.b, 'new value');
            });

            test('should replace existing deeply nested property', function () {
                utils.setProperty('a.b.c', 'new value', src);

                assert.equal(src.a.b.c, 'new value');
            });

            test('should keep sibing properties', function () {
                var c = src.a.b.c;
                utils.setProperty('a.b.d', 'new value', src);

                assert.equal(src.a.b.c, c);
            });

            test('should create new property', function () {
                utils.setProperty('f', 'new value', src);

                assert.equal(src.f, 'new value');
            });

            test('should create new deep property', function () {
                utils.setProperty('f.g.h', 'new value', src);

                assert.equal(src.f.g.h, 'new value');
            });

            test('should throw an error if task is impossible', function () {
                assert.throws(function () {
                    utils.setProperty('bool.a.b', 'new value', src);
                }, Error);
            });
        });

    });
});
