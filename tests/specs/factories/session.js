define([
    "chai",
    "fossil/application",
    "fossil/module",
    "fossil/factories/session"
], function (chai, Application, Module, Session) {

    var assert = chai.assert;

    describe('Fossil.Facroty.Session and Module', function () {
        it('should be exposed to module', function() {
            var application = new Application({
                factories: {
                    'session': Session
                },
                modules: {
                    '': Module
                }
            });

            assert.instanceOf(application.getModule('').factories.session, Session);
        });
    });

    describe('Fossil.Facroty.Session lifecycle', function () {

        it('should throw an error when not initialized with a application', function() {
            var session = new Session();

            assert.throw(session.get);
            assert.throw(session.set);
            assert.throw(session.has);
        });

        it('should throw an error when suspended from application', function() {
            var session = new Session();
            var application = new Application();

            session.activateApplication(application);
            session.suspendApplication(application);

            assert.throw(session.get);
            assert.throw(session.set);
            assert.throw(session.has);
        });
    });

    describe('Fossil.Facroty.Session data storage', function () {

        it('should expose model access', function() {
            var session = new Session();
            var application = new Application();
            session.activateApplication(application);

            assert.isFalse(session.has('foo'));
            session.set('foo', 'bar');
            assert.strictEqual(session.get('foo'), 'bar');
        });

    });

});
