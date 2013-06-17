define([
    "chai",
    "sinon",
    "underscore",
    "fossil/factory",
    "fossil/project",
    "fossil/application"
], function (chai, sinon, _, Factory, Project, Application) {

    var assert = chai.assert;

    describe('Fossil.Factory can manage options', function () {
        it('accepts default options', function() {
            var Factory1 = Factory.extend({
                options: {foo: 'bar'}
            });
            var factory = new Factory1();
            assert.deepEqual(factory.options, {foo: "bar"});
        });

        it('accepts an object as options', function() {
            var Factory1 = Factory.extend({
                options: {}
            });
            var factory = new Factory1({foo: 'bar'});
            assert.deepEqual(factory.options, {foo: "bar"});
        });

        it('overrides default options with given options', function() {
            var Factory1 = Factory.extend({
                options: {
                    foo: 'bar',
                    bar: 1
                }
            });
            var factory = new Factory1({
                foo: 'baz',
                baz: 2
            });
            assert.deepEqual(factory.options, {
                bar: 1,
                foo: "baz",
                baz: 2
            });
        });
    });

    describe('Fossil.Factory applies on project', function () {
        it('provides a way to communicate with project via PubSub', function(done) {
            this.timeout(10);
            var project = new Project();
            var factory = new Factory();
            factory.activateProject(project);

            factory.project.on('foo', done);
            factory.project.trigger('foo');
        });

        it('activates project on instanciation', function(done) {
            this.timeout(10);
            var project = new Project();
            var Factory1 = Factory.extend({
                _doActivateProject: function (_project) {
                    assert.strictEqual(project, _project);
                    done();
                }
            });
            var factory = new Factory1();
            factory.activateProject(project);
        });

        it('can be suspended', function(done) {
            this.timeout(10);
            done = _.after(2, done);

            var project = new Project();
            var Factory1 = Factory.extend({
                _doSuspendProject: function (_project) {
                    assert.strictEqual(project, _project);
                    done();
                }
            });
            var factory = new Factory1();
            factory.activateProject(project);
            factory.suspendProject(project);

            assert.isNull(factory.project, 'pubsub is removed');
            done();
        });
    });

    describe('Fossil.Factory applies on application', function () {
        it('activate any application registered later', function(done) {
            this.timeout(10);
            var application, factory, project;

            project = new Project();
            application = new Application(project);

            // create a stub factory to monitor application activation
            var Factory1 = Factory.extend({
                _doActivateApplication: function (_application, _project) {
                    assert.strictEqual(application, _application);
                    assert.strictEqual(project, _project);
                    done();
                }
            });

            factory = new Factory1();
            factory.activateProject(project);
            project.connect('', application);
        });

        it('activate any application registered before', function(done) {
            this.timeout(10);
            var application, factory, project;

            project = new Project();
            application = new Application(project);

            // create a stub factory to monitor application activation
            var Factory1 = Factory.extend({
                _doActivateApplication: function (_application, _project) {
                    assert.strictEqual(application, _application);
                    assert.strictEqual(project, _project);
                    done();
                }
            });

            project.connect('', application);
            factory = new Factory1();
            factory.activateProject(project);
        });

        it('does not affect application when suspended', function() {

            var project = new Project();
            var application = new Application(project);
            var Factory1 = Factory.extend({
                _doActivateApplication: function (_application, _project) {
                    assert.fail('It should be desactivated');
                }
            });
            var factory = new Factory1();
            factory.activateProject(project);
            factory.suspendProject(project);

            project.connect('', application);
        });

        it('suspend any application registered before', function(done) {
            this.timeout(10);
            var application, factory, project;

            project = new Project();
            application = new Application(project);

            // create a stub factory to monitor application activation
            var Factory1 = Factory.extend({
                _doSuspendApplication: function (_application, _project) {
                    assert.strictEqual(application, _application);
                    assert.strictEqual(project, _project);
                    done();
                }
            });

            project.connect('', application);
            factory = new Factory1();
            factory.activateProject(project);
            factory.suspendProject(project);
        });
    });

    describe('Fossil.Factory exposition to application', function () {
        it('should not be exposed as default', function() {
            var factory, project;

            factory = new Factory();
            project = new Project({
                factories: {
                    'foo': factory
                },
                applications: {
                    '': Application
                }
            });

            assert.isUndefined(project.getApplication('').factories.foo);
        });

        it('should be exposed', function () {
            var factory, project;

            // create a stub factory to monitor application activation
            var Factory1 = Factory.extend({
                options: {
                    exposeToApplication: true
                }
            });

            project = new Project();
            factory = new Factory1();

            project.connect('', Application);
            project.use('foo', factory);
            project.connect('bar', Application);

            assert.strictEqual(project.getApplication('').factories.foo, factory);
            assert.strictEqual(project.getApplication('bar').factories.foo, factory);
        });

        it('should be possible to define factories and applications in options', function (done) {
            this.timeout(10);
            var times = 0;
            done = _.after(3, done);
            var Project1 = Project.extend({
                factories: {
                    'factory1': new (Factory.extend({
                        options: {exposeToApplication: true},
                        // this should be called only once
                        _doActivateApplication: function (app) {
                            ++times;
                            if (times > 2) {
                                assert.ok(false, 'Application should be activated only once per application.');
                            }
                            done();
                        }
                    }))()
                },
                applications: {
                    '': Application.extend({}),
                    'app2': Application.extend({})
                }
            });

            new Project1();
            setTimeout(done, 5);
        });
    });

    describe('Fossil.Factory events', function () {

        it('should trigger a factory:%id%:ready on application when application is activated', function (done) {
            this.timeout(10);
            done = _.after(2, done);
            function eventTriggered() {
                done();
            }
            var project = new Project({
                factories: {
                    my_factory: Factory
                },
                applications: {
                    '': Application.extend({
                        events: {
                            'factory:my_factory:ready': eventTriggered
                        }
                    })
                }
            });

            project.connect('app/', Application.extend({
                events: {
                    'factory:my_factory:ready': eventTriggered
                }
            }));
        });

        it('should trigger a factory:%id%:ready on project when project is activated', function(done) {
            this.timeout(10);
            var project = new Project({
                factories: {
                    my_factory: Factory
                },
                events: {
                    'factory:my_factory:ready': function (factory) {
                        assert.instanceOf(factory, Factory);
                        done();
                    }
                }
            });
        });
    });
});
