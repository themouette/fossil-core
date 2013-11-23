define([
    'assert', 'sinon', 'backbone',
    'fossil/services/canvas', 'fossil/module'
], function (assert, sinon, Backbone, Canvas, Module) {
    "use strict";

    suite('service/canvas', function () {
        test('should be instanciatiable', function () {
            var canvas = new Canvas();
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

        suite('Options', function () {
            suite('#selector', function () {
                test('default: "body"', function () {
                    var canvas = new Canvas();
                    assert.equal(canvas.selector, "body");
                });
                test('is copied', function () {
                    var canvas = new Canvas({
                        selector: '.foo'
                    });
                    assert.equal(canvas.selector, ".foo");
                });
            });
            suite('#empty', function () {
                test('default: true', function () {
                    var canvas = new Canvas();
                    assert.ok(canvas.empty);
                });
                test('is copied', function () {
                    var canvas = new Canvas({
                        'empty': false
                    });
                    assert.notOk(canvas.empty);
                });
            });
            suite('#useDeep', function () {
                test('default: false', function () {
                    var canvas = new Canvas();
                    assert.notOk(canvas.useDeep);
                });
                test('is copied', function () {
                    var canvas = new Canvas({
                        'useDeep': true
                    });
                    assert.ok(canvas.useDeep);
                });
            });
        });
        suite('module event "do:view:attach"', function () {
            var canvas, module, view;
            setup(function () {
                canvas = new Canvas();
                module = new Module();
                view = sinon.mock();
                // override attachView method
                canvas.attachView = sinon.stub();

                module
                    .use('canvas', canvas)
                    .start();
            });
            test('listen on #use()', function () {
                module.attach(view);

                assert.ok(canvas.attachView.called);
            });
            test('stop listening on #dispose()', function () {
                module.dispose('canvas');

                module.attach(view);

                assert.notOk(canvas.attachView.called);
            });
        });
        suite('should append view to', function () {
            var canvas, module, view, el;
            setup(function () {
                // create a module with canvas.
                // canvas selector is a newly created element
                el = document.createElement('div');
                el.innerHTML = '<p></p>';
                canvas = new Canvas({
                    selector: el
                });
                module = new Module();
                view = new Backbone.View();

                module
                    .use('canvas', canvas)
                    .start();
            });
            test('canvas selector as default', function () {
                module.attach(view);

                assert.ok(view.el.parentNode === el);
            });
            test('should remove existing html', function () {
                module.attach(view);

                assert.equal(el.childNodes.length, 1);
            });
            test('module selector if any', function () {
                var moduleEl = document.createElement('div');
                module.selector = moduleEl;

                module.attach(view);

                assert.notOk(view.el.parentNode === el);
                assert.ok(view.el.parentNode === moduleEl);
            });
        });
        suite('should remove previous view from', function () {
            var canvas, module, view, el;
            setup(function () {
                // create a module with canvas.
                // canvas selector is a newly created element
                el = document.createElement('div');
                el.innerHTML = '<p></p>';
                canvas = new Canvas({
                    selector: el,
                    empty: false
                });
                module = new Module();
                view = new Backbone.View();

                module
                    .use('canvas', canvas)
                    .start();
            });
            test('canvas selector', function () {
                module.attach(view);

                assert.equal(el.childNodes.length, 2);
            });
        });
    });

});
