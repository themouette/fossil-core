define([
    'assert', 'sinon', 'underscore', 'fossil/module', 'fossil/modules/region',
    'fossil/views/regionManager', 'fossil/views/view'
], function (assert, sinon, _, Module, RegionModule, RegionManager, View) {
  "use strict";

    suite('RegionModule', function () {

        suite('options', function () {
            suite('#layout', function () {
                var layout;

                setup(function () {
                    layout = 'foo';
                });

                test('should use option value', function () {
                    var mod = new RegionModule({
                        layout: layout
                    });

                    assert.strictEqual(layout, mod.layout);
                });

                test('should use prototype value', function () {
                    var Mod = RegionModule.extend({
                        layout: layout
                    });
                    var mod = new Mod();

                    assert.strictEqual(layout, mod.layout);
                });

                test('should execute layout factory on start', function () {
                    var mod = new RegionModule({
                        layout: function () {return layout;}
                    });

                    mod.start();

                    assert.strictEqual(layout, mod.layout);
                });
            });
        }); // End of suite options

        suite('extension points', function () {
            var layout, spy;
            setup(function () {
                spy = sinon.spy();
                layout = 'foo';
            });
            test('should be possible to override regionManager options', function () {
                var Mod = RegionModule.extend({
                    computeLayoutOptions: function (options) {
                        spy.apply(this, arguments);
                        return options;
                    }
                });
                var mod = new Mod();
                mod.start();

                assert.ok(spy.calledOnce, 'computeLayoutOptions should be called only once');
                assert.ok(spy.calledWith({managerRendering: false}), 'with options');
                assert.ok(spy.calledOn(mod), 'with module as context');
            });
            test('should be possible to override regionManager creation', function () {
                var Mod = RegionModule.extend({
                    createLayout: function () {
                        spy.apply(this, arguments);
                        return layout;
                    }
                });
                var mod = new Mod();
                mod.start();

                assert.ok(spy.calledOnce, 'createLayout should be called only once');
                assert.ok(spy.calledWith({managerRendering: false}), 'with options');
                assert.ok(spy.calledOn(mod), 'with module as context');
                assert.strictEqual(layout, mod.layout, 'should be used as layout factory');
            });

            test('should process options with computeLayoutOptions', function () {
                var Mod = RegionModule.extend({
                    computeLayoutOptions: function (options) {
                        return _.extend({foo: 'bar'}, options);
                    },
                    createLayout: function () {
                        spy.apply(this, arguments);
                        return layout;
                    }
                });
                var mod = new Mod();
                mod.start();

                assert.ok(spy.calledWith({
                        foo: 'bar',
                        managerRendering: false
                    }), 'with options');
            });
        });

        suite('Layout rendering', function () {
            test('should be done as any view', function () {
                var layout, spy;
                layout = new RegionManager('foo');
                spy = sinon.spy();

                var mod = new RegionModule({
                    layout: layout
                });
                mod.on('do:view:render', spy);
                mod.start();

                assert.ok(spy.calledOnce, 'should trigger do:view:render event');
                assert.ok(spy.calledWith(mod, layout), 'should pass layout as view');
            });
        });

        suite('Layout attachement', function () {
            test('should be done as any view', function () {
                var layout, spy;
                layout = new RegionManager('foo');
                spy = sinon.spy();

                var mod = new RegionModule({
                    layout: layout
                });
                mod.on('do:view:attach', spy);
                mod.start();

                assert.ok(spy.calledOnce, 'should trigger do:view:attach event');
                assert.ok(spy.calledWith(mod, layout), 'should pass layout as view');
            });
        });

        suite('#removeLayout', function () {
            var layout, spy, mod;
            setup(function () {
                layout = new RegionManager('foo');
                spy = sinon.spy();
                mod = new RegionModule({
                    layout: layout
                });

                layout.remove = spy;
                mod.start();
            });
            test('should call layout remove method', function () {
                mod.removeLayout();
                assert.ok(spy.calledOnce);
            });
            test('should be called on standby', function () {
                mod.standby();
                assert.ok(spy.calledOnce);
            });
        });

        suite('#setRegion', function () {
            var layout, spy, mod, view;
            setup(function () {
                layout = new RegionManager({
                    regions: {foo: '.foo'}
                });
                spy = sinon.spy();
                mod = new RegionModule({
                    layout: layout
                });

                layout.registerView = spy;
                mod.start();
                view = new View();
            });

            test('should delegate to regionManger#registerView', function () {
                mod.setRegion(view, 'foo');

                assert.ok(spy.calledOnce, 'should be called once');
                assert.ok(spy.calledWith(view, 'foo'), 'should pass arguments');
            });
        }); // End of suite #setRegion

        suite('submodules', function () {
            suite('#connect', function () {
                var layout, spy, child, mod, view;
                setup(function () {
                    layout = new RegionManager({
                        regions: {foo: '.foo'}
                    });
                    spy = sinon.spy();
                    mod = new RegionModule({
                        layout: layout
                    });
                    child = new Module();

                    view = new View();
                });

                test('should forward parameters to Module.Connect', function () {
                    var options = {region: 'foo'};
                    var original = Module.prototype.connect;
                    Module.prototype.connect = spy;
                    mod.connect('foo', child, options);
                    Module.prototype.connect = original;

                    assert.ok(spy.calledOnce, 'parent method was called once');
                    assert.ok(spy.calledWith('foo', child, options), 'arguments are preserved');
                    assert.ok(spy.calledOn(mod), 'called with module context');
                });
                test('should copy #region option to submodule', function () {
                    var options = {region: 'foo'};
                    mod.connect('foo', child, options);

                    assert.strictEqual(child.region, 'foo');
                });
                test('should overwrite existing region property', function () {
                    var options = {region: 'foo'};
                    child.region = 'bar';
                    mod.connect('foo', child, options);

                    assert.strictEqual(child.region, 'foo');
                });
                test('should fallback to existing region property', function () {
                    var options = {};
                    child.region = 'bar';
                    mod.connect('foo', child, options);

                    assert.strictEqual(child.region, 'bar');
                });
            });
            suite('#forwardModuleAttach', function () {

            }); // End of suite #forwardModuleAttach
            suite('#setModuleRegion', function () {

            }); // End of suite #setModuleRegion
        });

    }); // End of Suite RegionModule
});
