define(['assert', 'sinon', 'fossil/module', 'backbone'], function (assert, sinon, Module, Backbone) {

    suite('Module', function () {

        suite('Routing', function () {

            suite('#navigate', callEventAndForwardExtraParams('do:route:navigate', 'navigate'));
            suite('#route', callEventAndForwardExtraParams('do:route:register', 'route'));

        }); // end of Routing suite

        suite('View', function () {

            suite('#render', callEventAndForwardExtraParams('do:view:render', 'render'));
            suite('#attach', callEventAndForwardExtraParams('do:view:attach', 'attach'));
            suite('#useView', function () {
                var render, attach, module, view;
                setup(function () {
                    render = sinon.spy();
                    attach = sinon.spy();
                    module = new Module();
                    module.on('do:view:render', render);
                    module.on('do:view:attach', attach);
                    view = new Backbone.View();
                });
                test('should render view', function () {
                    module.useView(view);

                    assert.ok(render.calledOnce);
                    assert.ok(attach.calledOnce);
                });
                test('should render rendered view', function () {
                    view._rendered = true;
                    module.useView(view);

                    assert.ok(render.calledOnce);
                    assert.ok(attach.calledOnce);
                });
                test('should render unrendered recycle view', function () {
                    view._rendered = false;
                    view.recycle = true;
                    module.useView(view);

                    assert.ok(render.calledOnce);
                    assert.ok(attach.calledOnce);
                });
                test('should not render rendered recycle view', function () {
                    view._rendered = true;
                    view.recycle = true;
                    module.useView(view);

                    assert.ok(!render.called);
                    assert.ok(attach.calledOnce);
                });
            });

        }); // end of View suite

        suite('Module', function () {

            suite('#connect', function () {
                suite('should trigger parent `on:child:connect` and child `do:connect:to:parent`', function () {
                    var parentSpy, childSpy, parent, child;
                    setup(function () {
                        parentSpy = sinon.spy();
                        childSpy = sinon.spy();
                        parent = new Module();
                        parent.on('on:child:connect', parentSpy);

                        child = new Module();
                        child.on('do:connect:to:parent', childSpy);
                    });

                    test('', function () {
                        parent.connect('foo', child);

                        assert.ok(parentSpy.calledOnce);
                        assert.ok(parentSpy.calledWith(child, 'foo', parent));

                        assert.ok(childSpy.calledOnce);
                        assert.ok(childSpy.calledWith(parent, 'foo', child));
                    });
                    test('and forward extra parameters', function () {
                        parent.connect('foo', child, 'bar', 'baz');

                        assert.ok(parentSpy.calledOnce);
                        assert.ok(parentSpy.calledWith(child, 'foo', parent, 'bar', 'baz'));

                        assert.ok(childSpy.calledOnce);
                        assert.ok(childSpy.calledWith(parent, 'foo', child, 'bar', 'baz'));
                    });
                });

                suite('with existing module', function () {
                    test('should disconnect it', function () {
                        var spy = sinon.spy();
                        var module = new Module();
                        var child = new Module();
                        module.disconnect = spy;

                        module.connect('foo', child);

                        assert.ok(!spy.called, 'should not be called when no module is registered');

                        module.connect('foo', child);
                        assert.ok(spy.called, 'should be called when a module is prensent');
                    });
                });
            }); // end of #connect

            suite('#disconnect', function () {
                suite('should trigger parent `on:child:disconnect` and child `do:disconnect:from:parent`', function () {
                    var parentSpy, childSpy, parent, child;
                    setup(function () {
                        parentSpy = sinon.spy();
                        childSpy = sinon.spy();
                        parent = new Module();
                        parent.on('on:child:disconnect', parentSpy);

                        child = new Module();
                        child.on('do:disconnect:from:parent', childSpy);

                        parent.connect('foo', child);
                    });

                    test('', function () {
                        parent.disconnect('foo');

                        assert.ok(parentSpy.calledOnce);
                        assert.ok(parentSpy.calledWith(child, 'foo', parent));

                        assert.ok(childSpy.calledOnce);
                        assert.ok(childSpy.calledWith(parent, 'foo', child));
                    });
                    test('and forward extra parameters', function () {
                        parent.disconnect('foo', 'bar', 'baz');

                        assert.ok(parentSpy.calledOnce, 'should call parent event');
                        assert.ok(parentSpy.calledWith(child, 'foo', parent, 'bar', 'baz'), 'should foward to parents');

                        assert.ok(childSpy.calledOnce, 'should call child event');
                        assert.ok(childSpy.calledWith(parent, 'foo', child, 'bar', 'baz'), 'should forward to child');
                    });
                });
            }); // end of #disconnect

        }); // end of Module suite

        suite('Service', function () {

            suite('#use', function () {
                suite('should trigger module `on:service:use` and service `do:use:module`', function () {
                    var moduleSpy, serviceSpy, module, service;
                    setup(function () {
                        moduleSpy = sinon.spy();
                        serviceSpy = sinon.spy();
                        module = new Module();
                        module.on('on:service:use', moduleSpy);

                        service = new Module();
                        service.on('do:use:module', serviceSpy);
                    });

                    test('', function () {
                        module.use('foo', service);

                        assert.ok(moduleSpy.calledOnce);
                        assert.ok(moduleSpy.calledWith(service, 'foo', module));

                        assert.ok(serviceSpy.calledOnce);
                        assert.ok(serviceSpy.calledWith(module, 'foo', service));
                    });
                    test('and forward extra parameters', function () {
                        module.use('foo', service, 'bar', 'baz');

                        assert.ok(moduleSpy.calledOnce);
                        assert.ok(moduleSpy.calledWith(service, 'foo', module, 'bar', 'baz'));

                        assert.ok(serviceSpy.calledOnce);
                        assert.ok(serviceSpy.calledWith(module, 'foo', service, 'bar', 'baz'));
                    });
                });

                suite('with existing module', function () {
                    test('should dispose it', function () {
                        var spy = sinon.spy();
                        var module = new Module();
                        var service = new Module();
                        module.dispose = spy;

                        module.use('foo', service);

                        assert.ok(!spy.called, 'should not be called when no module is registered');

                        module.use('foo', service);
                        assert.ok(spy.called, 'should be called when a module is prensent');
                    });
                });
            }); // end of #use

            suite('#dispose', function () {
                suite('should trigger module `on:dispose:service` and service `on:dispose:from:module`', function () {
                    var moduleSpy, serviceSpy, module, service;
                    setup(function () {
                        moduleSpy = sinon.spy();
                        serviceSpy = sinon.spy();
                        module = new Module();
                        module.on('on:service:dispose', moduleSpy);

                        service = new Module();
                        service.on('do:dispose:module', serviceSpy);

                        module.use('foo', service);
                    });

                    test('', function () {
                        module.dispose('foo');

                        assert.ok(moduleSpy.calledOnce);
                        assert.ok(moduleSpy.calledWith(service, 'foo', module));

                        assert.ok(serviceSpy.calledOnce);
                        assert.ok(serviceSpy.calledWith(module, 'foo', service));
                    });
                    test('and forward extra parameters', function () {
                        module.dispose('foo', 'bar', 'baz');

                        assert.ok(moduleSpy.calledOnce, 'should call module event');
                        assert.ok(moduleSpy.calledWith(service, 'foo', module, 'bar', 'baz'), 'should foward to modules');

                        assert.ok(serviceSpy.calledOnce, 'should call service event');
                        assert.ok(serviceSpy.calledWith(module, 'foo', service, 'bar', 'baz'), 'should forward to service');
                    });
                });
            }); // end of #dispose

        }); // end of suite Service

        suite('Options', function () {

            suite('#startWithParent', function () {

                test('should copy option', function () {
                    var module = new Module({
                        startWithParent: 'foo'
                    });

                    assert.equal(module.startWithParent, 'foo');
                });

                suite('is started with parent', function () {
                    var parent, module, sibling, child;
                    var parentSpy, moduleSpy, siblingSpy, childSpy;
                    setup(function () {
                        parentSpy = sinon.spy();
                        moduleSpy = sinon.spy();
                        siblingSpy = sinon.spy();
                        childSpy = sinon.spy();

                        parent = new Module({ events: { start: parentSpy } });
                        module = new Module({ events: { start: moduleSpy } });
                        sibling = new Module({ events: { start: siblingSpy } });
                        child = new Module({ events: { start: childSpy } });
                    });

                    test('should start submodules on start', function () {
                        sibling.startWithParent = true;
                        child.startWithParent = true;
                        parent
                            .connect('module', module)
                            .connect('sibling', sibling);
                        module
                            .connect('child', child);

                        module.start();

                        assert.ok(moduleSpy.calledOnce, 'should start module');
                        assert.ok(childSpy.calledOnce, 'should start child');
                    }); // end of suite is started with parent

                    test('should not start submodules or sibling on start', function () {
                        sibling.startWithParent = true;
                        child.startWithParent = true;
                        parent
                            .connect('module', module)
                            .connect('sibling', sibling);
                        module
                            .connect('child', child);

                        module.start();

                        assert.ok(!parentSpy.calledOnce, 'should not start parent');
                        assert.ok(moduleSpy.calledOnce, 'should start module');
                        assert.ok(!siblingSpy.calledOnce, 'should start sibling');
                        assert.ok(childSpy.calledOnce, 'should not start sibling');
                    }); // end of suite is started with parent

                    test('should start all submodules on start', function () {
                        sibling.startWithParent = true;
                        child.startWithParent = true;
                        parent
                            .connect('module', module);
                        module
                            .connect('child', child)
                            .connect('sibling', sibling);

                        module.start();

                        assert.ok(!parentSpy.calledOnce, 'should not start parent');
                        assert.ok(moduleSpy.calledOnce, 'should start module');
                        assert.ok(siblingSpy.calledOnce, 'should start sibling');
                        assert.ok(childSpy.calledOnce, 'should start sibling');
                    }); // end of suite is started with parent
                });

            }); // enf of suite #startWithParent

        }); // End of suite Options

    });

    function callEventAndForwardExtraParams(event, method) {
        return function () {
            var spy, module;
            setup(function () {
                spy = sinon.spy();
                module = new Module();
                module.on(event, spy);
            });

            test('triggers `'+event+'` with module', function () {
                module[method]();

                assert.ok(spy.calledOnce);
                assert.ok(spy.calledWith(module));
            });

            test('forwards parameters', function () {
                module[method]('foo', 'bar', 'baz');

                assert.ok(spy.calledOnce);
                assert.ok(spy.calledWith(module, 'foo', 'bar', 'baz'));
            });
        };
    }
});
