describe('Fossil.Service.Handlebars', function () {
    var mockRouter = 'something';
    var assert = chai.assert;

    it('should be instanciable', function() {
        var handlebars = new Fossil.Services.Handlebars({
            router: mockRouter
        });
    });
    it('should ask for router', function() {
        assert.throws(function () {
            new Fossil.Services.Handlebars({});
        });
    });
    it('should register url helper', function() {
        var handlebars = new Fossil.Services.Handlebars({
            router: mockRouter
        });
        var app = new Fossil.Application();
        app.use('hbs', handlebars);
        app.start();
        assert.isFunction(app.helpers.url);
    });
    it('should be possible to add helpers', function() {
        var handlebars = new Fossil.Services.Handlebars({
            router: mockRouter
        });
        var spy = function() {};

        handlebars.registerHelper('foo', spy);
        var app = new Fossil.Application();
        app
            .use('hbs', handlebars)
            .start();

        assert.isFunction(app.helpers.foo);
        assert.strictEqual(app.helpers.foo, spy);
    });
    it('should be possible to add helper factory', function() {
        var handlebars = new Fossil.Services.Handlebars({
            router: mockRouter
        });
        var spy = function() {};

        handlebars.registerHelperFactory(function (component) {
            return {'foo': spy};
        });
        var app = new Fossil.Application();
        app
            .use('hbs', handlebars)
            .start();

        assert.isFunction(app.helpers.foo);
        assert.strictEqual(app.helpers.foo, spy);
    });
});
