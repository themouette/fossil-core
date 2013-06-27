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
            it('should read options fragments property');
            it('should read prototype fragments property');
            it('options should override fragments property');
        });

        describe('Fragments management', function () {
        });
    });

});

