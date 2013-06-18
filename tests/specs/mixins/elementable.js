define([
    'chai',
    'jquery',
    'underscore',
    'fossil/mixins/elementable'
], function (chai, $, _, Elementable) {

    var assert = chai.assert;

    describe('Fossil.Mixins.Elementable', function () {
        var Elt = function () {
        };
        _.extend(Elt.prototype, Elementable);


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
    });
});
