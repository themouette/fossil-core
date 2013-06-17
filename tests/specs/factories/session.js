define([
    "chai",
    "fossil/project",
    "fossil/application",
    "fossil/factories/session"
], function (chai, Project, Application, Session) {

    var assert = chai.assert;

    describe('Fossil.Facroty.Session and Application', function () {
        it('should be exposed to application', function() {
            var project = new Project({
                factories: {
                    'session': Session
                },
                applications: {
                    '': Application
                }
            });

            assert.instanceOf(project.getApplication('').factories.session, Session);
        });
    });

    describe('Fossil.Facroty.Session lifecycle', function () {

        it('should throw an error when not initialized with a project', function() {
            var session = new Session();

            assert.throw(session.get);
            assert.throw(session.set);
            assert.throw(session.has);
        });

        it('should throw an error when suspended from project', function() {
            var session = new Session();
            var project = new Project();

            session.activateProject(project);
            session.suspendProject(project);

            assert.throw(session.get);
            assert.throw(session.set);
            assert.throw(session.has);
        });
    });

    describe('Fossil.Facroty.Session data storage', function () {

        it('should expose model access', function() {
            var session = new Session();
            var project = new Project();
            session.activateProject(project);

            assert.isFalse(session.has('foo'));
            session.set('foo', 'bar');
            assert.strictEqual(session.get('foo'), 'bar');
        });

    });

});
