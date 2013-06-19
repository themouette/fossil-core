define([
    'chai',
    'jquery',
    'underscore',
    'fossil/mixins/observable',
    'fossil/mixins/elementable'
], function (chai, $, _, Observable, Elementable) {

    var assert = chai.assert;

    describe('Fossil.Mixins.Elementable', function () {
        var Elt = function (options) {
            this.options = options || {};
            this.registerEvents();
        };
        _.extend(Elt.prototype, Observable, Elementable);


        it('is possible to set element and search within', function() {
            var e = new Elt();
            e.setElement($('<div><p></p><p></p></div>'));
            assert.equal(e.$el[0].tagName, 'DIV');
            assert.equal(e.$('p').length, 2);
        });

        it('triggers an error when element is not set and search is performed', function() {
            var e = new Elt();
            assert.throws(function () {
                e.$('p');
            });
        });

        it('triggers events (attach and detach)', function(done) {
            done = _.after(2, done);
            this.timeout(10);

            var e = new Elt({
                events: {
                    'elementable:attach': function (elt) {
                        assert.strictEqual(elt, e);
                        done();
                    },
                    'elementable:detach': function (elt) {
                        assert.strictEqual(elt, e);
                        done();
                    }
                }
            });

            e.setElement($('<div />'));
            e.detachElement();

        });
    });

});
