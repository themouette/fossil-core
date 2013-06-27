define([
    'chai',
    'underscore',
    'fossil/application',
    'fossil/fragment'
], function (chai, _, Application, Fragment) {

    var assert = chai.assert;

    describe('Fossil.Fragment', function () {
        var parent = new Application({
            selector: $('<div>')
        });

        describe('options management', function () {
            it('should read options fragments property', function () {
                var f = new Fragment(parent, {foo: 'bar'});
                assert.deepEqual(f.options, {foo: 'bar'});
            });
        });

        describe('Fragments events', function () {
            it('should trigger "setup" when attached to element', function(done) {
                this.timeout(10);
                var f = new Fragment(parent, {
                    events: {
                        'setup': function (component) {
                            assert.strictEqual(component, f);
                            done();
                        }
                    }
                });
                f.setElement($('<div />'));
            });
            it('should trigger "teardown" when detached from element', function(done) {
                this.timeout(10);
                var f = new Fragment(parent, {
                    events: {
                        'teardown': function (component) {
                            assert.strictEqual(component, f);
                            done();
                        }
                    }
                });
                f.detachElement();
            });
        });

        describe('Fragments management', function () {
            it('should be possible to register fagments on fragments');
        });
    });

});

