define([
    "chai",
    "underscore",
    "fossil/project",
    "fossil/application",
    "fossil/factory",
], function (chai, _, Project, Application, Factory) {

    var assert = chai.assert;

    describe('Fossil.Project configuration', function () {
        it('should be possible to give applications as options', function() {
            var Application1 = Application.extend({});
            var Application2 = Application.extend({});
            var project = new Project({
                applications: {
                    '': Application1,
                    'foo': Application2
                }
            });

            assert.equal(_.size(project.getApplication()), 2, 'It is possible to access all applicaitons at once');
            assert.instanceOf(project.getApplication(""), Application1, 'Applicaiton key can be empty');
            assert.instanceOf(project.getApplication("foo"), Application2, 'Applicaiton key can contain letters');
        });

        it('should be possible to register events as options', function(done) {
            this.timeout(10);
            done = _.after(2, done);
            var Project1 = Project.extend({
                bar: function () {
                    assert.ok('It is possible to define callbacks directly in event hash');
                    done();
                }
            });
            var project = new Project1({
                events: {
                    'foo': function () {
                        assert.ok('It is possible to define callbacks directly in event hash');
                        done();
                    },
                    'bar': 'bar'
                }
            });

            project.trigger('foo');
            project.trigger('bar');
        });
    });

    describe('Fossil.Project can connect application', function () {

        it('should be possible to connect an Application and retrieve it.', function () {
            var project = new Project();
            project.connect('', Application);

            assert.equal(_.size(project.getApplication()), 1, 'It is possible to access all applicaitons at once');
            assert.instanceOf(project.getApplication(""), Application, 'Registered application is accessible via path key');
        });

        it('should be possible to connect multiple Application-s.', function () {
            var Application1 = Application.extend({});
            var Application2 = Application.extend({});
            var Application3 = Application.extend({});
            var project = new Project();
            project.connect('', Application1);
            project.connect('foo', Application2);
            project.connect('bar/baz', Application3);

            assert.equal(_.size(project.getApplication()), 3, 'It is possible to access all applicaitons at once');
            assert.instanceOf(project.getApplication(""), Application1, 'Applicaiton key can be empty');
            assert.instanceOf(project.getApplication("foo"), Application2, 'Applicaiton key can contain letters');
            assert.instanceOf(project.getApplication("bar/baz"), Application3, 'Application key can be a path');
        });

        it('should be possible to connect Application instance', function() {
            var project = new Project();
            project.connect('', new Application(project));

            assert.equal(_.size(project.getApplication()), 1, 'It is possible to access all applicaitons at once');
            assert.instanceOf(project.getApplication(""), Application, 'Registered application is accessible via path key');
        });

        it('connects application key as path', function () {
            var project = new Project();
            project.connect('foo', Application);

            assert.equal(project.getApplication('foo').path, 'foo');
        });
    });

    describe('Fossil.Project can use Factory-s', function () {
        it('should be possible to use a factory and retreive it', function () {
            var project = new Project();
            project.use('foo', new Factory());

            assert.instanceOf(project.factories.foo, Factory);
        });

        it('should be possible to use multiple factories and retreive it', function () {
            var project = new Project();
            var Factory1 = Factory.extend({});
            var Factory2 = Factory.extend({});

            project.use('foo', new Factory1());
            project.use('bar', new Factory2());

            assert.instanceOf(project.factories.foo, Factory1);
            assert.instanceOf(project.factories.bar, Factory2);
        });

        it('should be possible to use an uninstanciated factory', function () {
            var project = new Project();
            project.use('foo', Factory);

            assert.instanceOf(project.factories.foo, Factory);
        });

        it('should be possible to define factories in options', function () {
            var project = new Project({
                factories: {
                    'foo': Factory
                }
            });

            assert.instanceOf(project.factories.foo, Factory);
        });

        it('should activate factory for project when in use', function (done) {
            this.timeout(10);
            var project = new Project();
            var Factory1 = Factory.extend({
                _doActivateProject: function (_project) {
                    assert.strictEqual(project, _project);
                    done();
                }
            });

            project.use('factory1', Factory1);
        });

        it('should suspend previous factory for project when in use', function (done) {
            this.timeout(10);
            done = _.after(3, done);
            var project = new Project();
            var Factory1 = Factory.extend({
                _doSuspendProject: function (_project) {
                    assert.strictEqual(project, _project);
                    done();
                }
            });
            var Factory2 = Factory.extend({
                _doActivateProject: function (_project) {
                    assert.strictEqual(project, _project);
                    done();
                }
            });

            project.use('factory1', Factory1);
            project.use('factory1', Factory2);
            assert.instanceOf(project.factories.factory1, Factory2);
            done();
        });

        it('should trigger a factory:use event when new factory is used', function (done) {
            this.timeout(10);
            var project = new Project();
            var factory = new Factory();
            project.on('factory:use', function (_factory, id, project) {
                assert.strictEqual(_factory, factory);
                assert.equal(id, 'factory1');
                done();
            });
            project.use('factory1', factory);
        });
    });

    describe('Fossil.Project provides a PubSub', function (done) {
        it('should be possible to communicate using events', function() {
            this.timeout(10);
            var project = new Project();
            project.on('foo', done);
            project.trigger('foo');
        });

        it('should accept events definition in the prototype', function(done) {
            this.timeout(10);
            var Project1 = Project.extend({
                events: {
                    'bar': 'foo'
                },
                foo: function () {
                    done();
                }
            });

            var project = new Project1();
            project.trigger('bar');
        });
    });

    describe('Fossil.Project Publish Subscribe generation', function () {
        it('should be able to register listeners on project', function(done) {
            this.timeout(10);
            var project = new Project();
            var pubsub = project.createPubSub();

            pubsub.on('foo', done);
            project.trigger('foo');
        });

        it('should be able to trigger events on project', function(done) {
            this.timeout(10);
            var project = new Project();
            var pubsub = project.createPubSub();

            project.on('foo', function () {
                assert.deepEqual(arguments, ["a", "b"], 'It is possible to pass arguments');
                done();
            });
            pubsub.trigger('foo', "a", "b");
        });

        it('should be able to unregister a listener', function() {
            var project = new Project();
            var pubsub = project.createPubSub();

            function callback() {
                throw new Error('this should have been removed');
            }

            project.on('foo', callback);
            pubsub.off('foo', callback);
            project.trigger('foo', "a", "b");
        });
    });
});
