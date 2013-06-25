define([
    'chai',
    'underscore',
    'fossil/mixins/events',
    'fossil/mixins/layout',
    'fossil/mixins/fragmentable'
], function (chai, _, Events, Layout, Fragmentable) {

    var assert = chai.assert;

    describe('Fossil.Mixins.Fragmentable', function () {

        var Fragment = function (options) {
            this.options = options || {};
        };
        _.extend(Fragment.prototype, Events, Layout, Fragmentable, {
            fagments: {
                foo: ''
            }
        });

        describe('options management', function () {
            it('should read options fragments property', function () {
                var f = new Fragment();

            });
            it('should read prototype fragments property', function () {
            });
            it('options should override fragments property', function () {
            });
        });

        describe('Fragments management', function () {
        });
    });

});

