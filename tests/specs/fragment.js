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
            it('should trigger "start" when attached to element', function(done) {
                this.timeout(10);
                var f = new Fragment(parent, {
                    events: {
                        'start': function (component) {
                            assert.strictEqual(component, f);
                            done();
                        }
                    }
                });
                f.setElement($('<div />'));
            });
            it('should trigger "standby" when detached from element', function(done) {
                this.timeout(10);
                var f = new Fragment(parent, {
                    events: {
                        'standby': function (component) {
                            assert.strictEqual(component, f);
                            done();
                        }
                    }
                });
                f.setElement($('<div />'));
                f.detachElement();
            });
        });

        describe('Fragments management', function () {
            it('should be possible to register fagments on fragments');
        });
    });

});

