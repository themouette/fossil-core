(function (assert, sinon, $, _, Observable, Elementable, Layoutable) {
    'use strict';

    describe('Fossil.Mixins.Layoutable', function () {
        // create an object implementing Layoutable
        var Layout = function (options) {
            this.options = options || {};
            this.initLayoutable();
        };
        _.extend(Layout.prototype, Observable, Elementable, Layoutable);

        describe('event workflow', function () {

            it('should trigger layout:setup when layout is not initialized', function(done) {
                this.timeout(10);
                var $div = $('<div />');
                var l = new Layout();
                l.on('layout:setup', function (layoutable) {
                    assert.strictEqual(layoutable, l, 'first agument is the layoutable');
                    done();
                });
                l.setElement($div);
                l.renderLayout();
            });

            it('should trigger layout:setup only once', function() {
                var l = new Layout();
                l.setElement($('<div>'));
                l.renderLayout();
                l.on('layout:setup', function () {
                        assert.ok(false, 'layout:setup should have been called already');
                    });
                l.removeLayout();
                l.renderLayout();
            });

            it('should trigger layout:render every time render is called', function(done) {
                done = _.after(2, done);
                this.timeout(10);

                var l = new Layout();
                l.setElement($('<div>'));
                l.on('layout:render', function (layoutable) {
                    assert.strictEqual(layoutable, l, 'first agument is the layoutable');
                    done();
                });
                l.renderLayout();
                l.removeLayout();
                l.renderLayout();
            });

            it('should trigger layout:remove every time remove is called', function(done) {
                done = _.after(2, done);
                this.timeout(10);

                var l = new Layout();
                l.setElement($('<div>'));
                l.on('layout:remove', function (layoutable) {
                    assert.strictEqual(layoutable, l, 'first agument is the layoutable');
                    done();
                });
                l.renderLayout();
                l.removeLayout();
                l.renderLayout();
                l.removeLayout();
            });
        });

        describe('`renderView`', function () {
            it('should be used if available', function() {
                var spy = sinon.spy();
                var l = new Layout();
                l.renderView = spy;

                l.setElement($('<div>'));
                l.renderLayout();
                assert.ok(spy.calledOnce);
                assert.ok(spy.calledWith(l.layout));
            });
            it('is not mandatory', function() {
                var l = new Layout();
                l.renderView = null;

                l.setElement($('<div>'));
                l.renderLayout();
            });
        });

        describe('template property', function () {
            it('should accept _ templates', function() {
                var l = new Layout({
                    template: _.template('foo')
                });
                var $el = $('<div/>');
                l.setElement($el);
                l.renderLayout();
                assert.equal($el.html(), 'foo');
            });

            it('should accept string template', function () {
                var l = new Layout({
                    template: 'foo'
                });
                var $el = $('<div/>');
                l.setElement($el);
                l.renderLayout();
                assert.equal($el.html(), 'foo');
            });
            it('should accept function template', function () {
                var spy = sinon.spy();
                var l = new Layout({
                    template: function () {
                        spy();
                        return 'foo';
                    }
                });
                var $el = $('<div/>');
                l.setElement($el);
                l.setLayout(l.template, /* recycle */true);
                assert.ok(!spy.callCount, 'function is not executed first.');
                l.renderLayout();
                assert.ok(spy.calledOnce);
                assert.equal($el.html(), 'foo');
            });

            it('should accept view template', function () {
                var l = new Layout({
                    template: Backbone.View.extend({
                        className: 'view',
                        render: function () {
                            this.$el.html('foo');
                            return this;
                        }
                    })
                });
                var $el = $('<div/>');
                l.setElement($el);
                l.renderLayout();
                assert.equal($el.html(), 'foo');
            });

            it('should accept instanciated view template', function () {
                var l = new Layout({
                    template: new (Backbone.View.extend({
                        className: 'view',
                        render: function () {
                            this.$el.html('foo');
                            return this;
                        }
                    }))()
                });
                var $el = $('<div/>');
                l.setElement($el);
                l.renderLayout();
                assert.equal($el.html(), 'foo');
            });
        });

        describe('layout can be replaced', function () {
            var l, $el;
            var template = 'foo';
            var templateReplace = 'bar';

            beforeEach(function () {
                l = new Layout({ template: template });
                $el = $('<div/>');
                l.setElement($el);
            });

            it('when still off', function() {
                l.setLayout(templateReplace);
                assert.equal($el.html(), templateReplace);
            });
            it('when already attached', function() {
                l.renderLayout();
                l.setLayout(templateReplace);
                assert.equal($el.html(), templateReplace);
            });
            it('should trigger layout:setup when renders', function() {
                var spy = sinon.spy();
                l.on('layout:setup', spy);
                l.renderLayout();
                assert.ok(spy.calledOnce, "should trigger at first render");

                l.setLayout(templateReplace);
                assert.ok(spy.calledTwice, "should trigger on layout replace");

                assert.equal($el.html(), templateReplace);
            });
            it('and should reattach if reselected', function() {
                l.renderLayout();
                l.removeLayout();
                l.renderLayout();
                assert.equal($el.html(), template);
            });
        });
    });

})(chai.assert, sinon, jQuery, _, Fossil.Mixins.Observable, Fossil.Mixins.Elementable, Fossil.Mixins.Layoutable);
