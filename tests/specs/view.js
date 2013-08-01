(function (assert, sinon, _, View) {

    describe('Fossil.View', function () {
        describe('`getViewData` method', function () {
            it('should be invoked', function() {
                var spy = sinon.spy();
                var View1 = View.extend({
                    getViewData: spy
                });

                var v = new View1();
                v.render();
                assert.ok(spy.calledOnce);
            });
            it('is not mandatory', function() {
                var View1 = View.extend({
                    getViewData: null
                });

                var v = new View1();
                v.render();
            });
        });

        describe('`precompile` method', function () {
            it('should be invoked', function() {
                var spy = sinon.spy();
                var View1 = View.extend({
                    precompile: spy
                });

                var v = new View1();
                v.render();
                assert.ok(spy.calledOnce);
            });
            it('is not mandatory', function() {
                var View1 = View.extend({
                    precompile: null
                });

                var v = new View1();
                v.render();
            });
        });

        describe('`renderHtml` method', function () {
            it('should be invoked', function() {
                var spy = sinon.spy();
                var View1 = View.extend({
                    renderHtml: spy
                });

                var v = new View1();
                v.render();
                assert.ok(spy.calledOnce);
            });
            it('is not mandatory', function() {
                var View1 = View.extend({
                    renderHtml: null
                });

                var v = new View1();
                v.render();
            });
            it('should get the render extra parameters', function() {
                var spy = sinon.spy();
                var View1 = View.extend({
                    renderHtml: spy
                });

                var v = new View1();
                v.render('foo', 'bar');
                assert.ok(spy.calledWith({}, 'foo', 'bar'));
            });
        });

        describe('template property', function () {
            var msg1 = 'foo';
            var msg2 = 'something else';

            it('can be passed as option', function() {
                var View1 = View.extend({
                    template: msg1
                });
                var v = new View1();
                v.render();
                assert.equal(v.$el.html(), msg1);
            });
            it('can be passed as property', function() {
                var View1 = View.extend();
                var v = new View1({
                    template: msg1
                });
                v.render();
                assert.equal(v.$el.html(), msg1);
            });
            it('options override property', function() {
                var View1 = View.extend({
                    template: msg1
                });
                var v = new View1({
                    template: msg2
                });
                v.render();
                assert.equal(v.$el.html(), msg2);
            });
        });

    });

})(chai.assert, sinon, _, Fossil.View);
