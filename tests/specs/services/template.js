define([
    'assert', 'sinon', 'backbone', 'fossil/module', 'fossil/services/template'
], function (assert, sinon, Backbone, Module, Template) {
    "use strict";
    var mockEngine = function () {
        return {
            start: sinon.spy(),
            render: sinon.spy()
        };
    };

    suite('service/template', function () {
        suite('options', function () {
            suite("service#engine", function () {
                test('should be copied', function () {
                    var engine = mockEngine();
                    var template = new Template({engine: engine});

                    assert.equal(template.engine, engine);
                });
            });
            suite("module#helpers", function () {
                test('should be copied', function () {
                    var helpers = {a: 1};
                    var module = new Module({helpers: helpers});
                    module.use('template', new Template({engine: mockEngine()}));

                    assert.equal(module.helpers, helpers);
                });
                test('should be initialized', function () {
                    var module = new Module();
                    module.use('template', new Template({engine: mockEngine()}));

                    assert.isObject(module.helpers);
                });
                test('should not be erased', function () {
                    var helpers = {a: 1};
                    var module = new (Module.extend({
                                        helpers: helpers
                                    }))();
                    module.use('template', new Template({engine: mockEngine()}));

                    assert.equal(module.helpers, helpers);
                });
            });
        }); // end of suite options

        suite('Engine', function () {

            suite('engine starts', function () {
                var engine = mockEngine();
                var template = new Template({engine: engine});

                assert.ok(engine.start.calledOnce);
            });

        });

        suite('Module', function () {
            var module, engine, template, view;
            setup(function () {
                module = new Module();
                engine = mockEngine();
                template = new Template({engine: engine});
                view = new Backbone.View();
                module.use('template', template);
            });

            suite('#render', function () {
                test('should call engine rendering', function () {
                    module.render(view);

                    assert.ok(engine.render.calledOnce);
                });
                test('should pass view to `engine.render`', function () {
                    module.render(view);

                    assert.ok(engine.render.calledWith(view));
                });
                test('should pass view and module as `data`', function () {
                    module.render(view);

                    assert.ok(engine.render.calledWith(view, {}, {
                            view: view,
                            module: module
                        }));
                });
                test('should pass module helpers', function () {
                    var helpers = {a: 1};
                    module.helpers = helpers;
                    module.render(view);

                    assert.ok(engine.render.calledWith(view, helpers));
                });
                test('should pass service helpers', function () {
                    var helpers = {a: 1};
                    template.helpers = helpers;
                    module.render(view);

                    assert.ok(engine.render.calledWith(view, helpers));
                });
                test('should pass view helpers', function () {
                    var helpers = {a: 1};
                    view.helpers = helpers;
                    module.render(view);

                    assert.ok(engine.render.calledWith(view, helpers));
                });
            }); // end of suite #render

            suite('do:register:helper', function () {
                test('should register a new helper on service', function () {
                    var spy = sinon.spy();
                    module.trigger('do:register:helper', 'foo', spy);

                    assert.propertyVal(template.helpers, 'foo', spy);
                });
                test('should register a new helper on module', function () {
                    var spy = sinon.spy();
                    module.trigger('do:register:helper', 'foo', spy, module);

                    assert.propertyVal(module.helpers, 'foo', spy);
                });
            });

        }); // end of suite Module
    });

});

