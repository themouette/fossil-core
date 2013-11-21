define(['assert', 'fossil/services/canvas', 'fossil/module'], function (assert, Canvas, Module) {
    "use strict";

    suite('service/canvas', function () {
        test('should be instanciatiable', function () {
            var canvas = new Canvas();
        });

        test('should have `deepUse` to true', function () {
            var canvas = new Canvas();
            assert.ok(!canvas.useDeep);
        });

        test('should be possible to use', function() {
            var canvas = new Canvas();
            var module = new Module();

            module.use(canvas);
        });

        test('should be possible to dispose', function() {
            var canvas = new Canvas();
            var module = new Module();

            module.use(canvas);
            module.dispose(canvas);
        });
    });

});
