(function (assert, _, Observable, Layoutable, Fragmentable) {
    'use strict';

    describe('Fossil.Mixins.Fragmentable', function () {

        var Fragment = function (options) {
            this.options = options || {};
        };
        _.extend(Fragment.prototype, Observable, Layoutable, Fragmentable, {
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

})(chai.assert, _, Fossil.Mixins.Observable, Fossil.Mixins.Layoutable, Fossil.Mixins.Fragmentable);

