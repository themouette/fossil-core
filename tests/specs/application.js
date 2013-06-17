define([
    "chai",
    "fossil/application",
    "fossil/project"
], function (chai, Application, Project) {

    var assert = chai.assert;

    describe('Fossil.Application constructor prototype', function () {

        it('accepts `path` as second argument', function() {
            var project = new Project();
            var app = new Application(project, 'path');

            assert.equal(app.path, 'path');
            assert.isObject(app.options);
        });

        it('accepts `path` as an option', function() {
            var project = new Project();
            var app = new Application(project, {path: 'path'});

            assert.equal(app.path, 'path');
            assert.isObject(app.options);
        });

        it('sould be possible to give no path nor options', function() {
            var project = new Project();
            var app = new Application(project);

            assert.equal(app.path, '');
            assert.isObject(app.options);
        });
    });

    describe('Fossil.Application can communicate with project via pubsub', function () {
        it('proveds access to project pubsub', function(done) {
            var project = new Project();
            var app = new Application(project);

            app.project.on('foo', done);
            app.project.trigger('foo');
        });
    });
});

