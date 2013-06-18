define([
    'chai',
    'jquery',
    'underscore',
    'fossil/mixins/events',
    'fossil/mixins/layout'
], function (chai, $, _, Events, Layoutable) {

    var assert = chai.assert;

    describe('Fossil.Mixins.Layout', function () {
        // create an object implementing Layoutable
        var Layout = function (options) {
            this.options = options || {};
        };
        _.extend(Layout.prototype, Events, Layoutable);

        describe('event workflow', function () {

            it('should trigger layout:setup when layout is not initialized', function(done) {
                this.timeout(10);
                var $div = $('<div />');
                var l = new Layout();
                l.on('layout:setup', function (layoutable, $el) {
                    assert.strictEqual(layoutable, l, 'first agument is the layoutable');
                    assert.strictEqual($el, $div, 'second argument is the element');
                    done();
                });
                l.renderLayout($div);
            });

            it('should trigger layout:setup only once', function() {
                var l = new Layout();
                l.renderLayout($('<div />'));
                l.on('layout:setup', function () {
                        assert.ok(false, 'layout:setup should have been called already');
                    });
                l.removeLayout();
                l.renderLayout($('<div />'));
            });

            it('should trigger layout:render every time render is called', function(done) {
                done = _.after(2, done);
                this.timeout(10);

                var l = new Layout();
                l.on('layout:render', function (layoutable) {
                    assert.strictEqual(layoutable, l, 'first agument is the layoutable');
                    done();
                });
                l.renderLayout($('<div />'));
                l.removeLayout();
                l.renderLayout($('<div />'));
            });

            it('should trigger layout:remove every time remove is called', function(done) {
                done = _.after(2, done);
                this.timeout(10);

                var l = new Layout();
                l.on('layout:remove', function (layoutable) {
                    assert.strictEqual(layoutable, l, 'first agument is the layoutable');
                    done();
                });
                l.renderLayout($('<div />'));
                l.removeLayout();
                l.renderLayout($('<div />'));
                l.removeLayout();
            });
        });

        describe('template property', function () {
            it('should accept sting template', function () {
                var l = new Layout({
                    template: 'foo'
                });
                var $el = $('<div/>');
                l.renderLayout($el);
                assert.equal($el.html(), '<div>foo</div>');
            });
            it('should accept function template', function () {
                var l = new Layout({
                    template: function () {
                        assert.strictEqual(this, l, 'context is the layout object');
                        return 'foo';
                    }
                });
                var $el = $('<div/>');
                l.renderLayout($el);
                assert.equal($el.html(), '<div>foo</div>');
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
                l.renderLayout($el);
                assert.equal($el.html(), '<div class="view">foo</div>');
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
                l.renderLayout($el);
                assert.equal($el.html(), '<div class="view">foo</div>');
            });
        });
    });

});
