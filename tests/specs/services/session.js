define([
    'assert', 'sinon', 'backbone', 'fossil/module', 'fossil/services/session'
], function (assert, sinon, Backbone, Module, Session) {

    suite('Session', function () {

        suite('Options', function () {
            test('#defaults', function() {
                var defaults = {a:1};
                var session = new Session({
                    defaults: defaults
                });

                assert.equal(session.get('a'), 1);
            });
            test('#model', function () {
                var model = new Backbone.Model({b: 2});
                var session = new Session({
                    model: model
                });

                assert.equal(session.get('b'), 2);
            });
        });

        suite('should expose model methods', function() {
            var model, session, module;
            setup(function () {
                model = new Backbone.Model();
                model.has = sinon.spy();
                model.get = sinon.spy();
                model.set = sinon.spy();
                session = new Session({
                    model: model
                });
                module = new Module();
            });
            suite('#get', function() {
                test('to session', function() {
                    session.get('foo');
                });
                test('as module event', function () {
                    module.use('session', session);

                    module.trigger('do:get:session', 'foo');
                });
                teardown(function () {
                    assert.ok(model.get.calledOnce);
                    assert.ok(model.get.calledWith('foo'));
                });
            });
            suite('#has', function() {
                test('to session', function() {
                    session.has('foo');
                });
                test('as module event', function () {
                    module.use('session', session);

                    module.trigger('do:has:session', 'foo');
                });
                teardown(function () {
                    assert.ok(model.has.calledOnce);
                    assert.ok(model.has.calledWith('foo'));
                });
            });
            suite('#set', function() {
                test('to session', function() {
                    session.set('foo', 'bar');
                });
                test('as module event', function () {
                    module.use('session', session);

                    module.trigger('do:set:session', 'foo', 'bar');
                });
                teardown(function () {
                    assert.ok(model.set.calledOnce);
                    assert.ok(model.set.calledWith('foo', 'bar'));
                });
            });
        });

        suite('Module', function () {

            test('should expose model api', function() {
                var session = new Session();
                var module = new Module();
                module.use('session', session);

                assert.isFalse(session.has('foo'));

                session.set('foo', 'bar');

                assert.strictEqual(session.get('foo'), 'bar');

                assert.isTrue(session.has('foo'));
            });

            test('should expose provided model access', function() {
                var model = new Backbone.Model();
                var session = new Session({model: model});
                var module = new Module();
                module.use('session', session);

                assert.isFalse(session.has('foo'));
                assert.isFalse(model.has('foo'));

                session.set('foo', 'bar');

                assert.strictEqual(session.get('foo'), 'bar');
                assert.strictEqual(model.get('foo'), 'bar');

                model.set('foo', 'baz');

                assert.strictEqual(session.get('foo'), 'baz');
                assert.strictEqual(model.get('foo'), 'baz');

                assert.isTrue(session.has('foo'));
                assert.isTrue(model.has('foo'));
            });

            test('should access model method throug events', function () {
                var session = new Session();
                var module = new Module();
                module.use('session', session);

                assert.isFalse(module.trigger('one!do:has:session', 'foo'));
                module.trigger('do:set:session', 'foo', 'bar');
                assert.strictEqual(module.trigger('one!do:get:session', 'foo'), 'bar');
                assert.isTrue(module.trigger('one!do:has:session', 'foo'));
            });
        });

    });


});
