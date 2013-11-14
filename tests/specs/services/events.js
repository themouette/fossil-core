define([
    'assert', 'sinon', 'underscore', 'fossil/module', 'fossil/services/events'
], function (assert, sinon, _, Module, Events) {
    suite('services/events', function () {
        var methods = ['on', 'off', 'once', 'trigger'];
        var events, module, fooSpy;

        setup(function () {
            fooSpy = sinon.spy();
            events = new Events();
            module = new Module();
            events.on('foo', fooSpy);
            module.use('events', events);
        });

        suite('#use', function () {
            test('should add app! modifier', function () {
                module.trigger('app!foo');

                assert.ok(fooSpy.calledOnce);
            });
        });

        suite('#dispose', function () {
            test('should remove app! modifier', function () {
                module.dispose('events', events);
                module.trigger('app!foo');

                assert.ok(!fooSpy.called);
            });
        });

        suite('app! modifier', function () {
            test('should pass arguments', function () {
                module.trigger('app!foo', 'bar', 'baz');

                assert.ok(fooSpy.calledOnce);
                assert.ok(fooSpy.calledWith('bar', 'baz'));
            });
        });
    });
});
