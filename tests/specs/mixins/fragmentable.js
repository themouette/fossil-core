(function (assert, _, Observable, Layoutable, Fragmentable) {
    'use strict';

    describe('Fossil.Mixins.Fragmentable', function () {
        var parent;

        var Fragment = function (options) {
            this.options = options || {};
            this.initFragmentable();
        };
        _.extend(Fragment.prototype, Observable, Layoutable, Fragmentable);

        Fragment.extend = function (props) {
            var Child = function (ancestor, options) {
                this.options = options || {};
                this.initFragmentable();
            };
            _.extend(Child.prototype, Fragment.prototype, props || {});
            return Child;
        };

        describe('options management', function () {

            var Fragment1 = Fragment.extend({
                fragments: {
                    'constructors1': Fragment.extend({id: 'constructors1'}),
                    'constructors2': Fragment.extend({id: 'constructors2'})
                }
            });

            it('fragments extends and replace originals', function() {
                var f = new Fragment1(parent, {
                    fragments: {
                        'options1': Fragment.extend({id: 'options1'})
                    }
                });

                assert.equal(f.ensureFragment('options1').id, 'options1');
            });
            it('should read prototype fragments property', function () {
                var f = new Fragment1(parent, { });

                assert.equal(f.ensureFragment('constructors2').id, 'constructors2');
                assert.equal(f.ensureFragment('constructors1').id, 'constructors1');
            });
            it('options should override fragments property', function () {
                var f = new Fragment1(parent, {
                    fragments: {
                        'options1': Fragment.extend({id: 'options1'}),
                        'constructors2': Fragment.extend({id: 'options2'})
                    }
                });

                assert.equal(f.ensureFragment('options1').id, 'options1');
                assert.equal(f.ensureFragment('constructors2').id, 'options2');
                assert.equal(f.ensureFragment('constructors1').id, 'constructors1');
            });
        });

        describe('Fragments management', function () {
        });
    });

})(chai.assert, _, Fossil.Mixins.Observable, Fossil.Mixins.Layoutable, Fossil.Mixins.Fragmentable);

