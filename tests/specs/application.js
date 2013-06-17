define([
    "chai",
    "fossil/application",
    "fossil/project"
], function (chai, Application, Project) {

    var assert = chai.assert;

    describe('Fossil.Application', function () {
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

        describe('Fossil.Application events registration', function () {

            it('should regiter events on application pub sub', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var project = new Project({
                    applications: {
                        app1: Application.extend({
                            events: {
                                'foo': 'foo',
                                'bar': function () {
                                    done();
                                }
                            },
                            projectEvents: {
                                'foo': function () {
                                    assert.ok(false, 'It should not register projectEvents in app pubSub');
                                }
                            },
                            foo: function () {
                                done();
                            }
                        })
                    }
                });

                project.getApplication('app1').trigger('foo');
                project.getApplication('app1').trigger('bar');
            });

            it('should regiter projectEvents on application pub sub', function (done) {
                this.timeout(10);
                done = _.after(2, done);
                var project = new Project({
                    applications: {
                        app1: Application.extend({
                            projectEvents: {
                                'foo': 'foo',
                                'bar': function () {
                                    done();
                                }
                            },
                            events: {
                                'foo': function () {
                                    assert.ok(false, 'It should not register events in project pubSub');
                                }
                            },
                            foo: function () {
                                done();
                            }
                        })
                    }
                });

                project.trigger('foo');
                project.trigger('bar');
            });
        });
    });
});

