define([
    'chai',
    'fossil/application',
    'fossil/module',
    'fossil/factories/layout'
], function (chai, Application, Module, LayoutFactory) {

    var assert = chai.assert;

    describe('Fossil.Factories.Layout', function () {
        describe('Template property can be of several types', function () {

            it('accepts a Backbone.View as template');

            it('accepts a function as template');

            it('accepts a string as template');
        });
    });

});
