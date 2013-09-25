Handlebars adapter
==================

Handlebars adapter provide Handlebars processing on string templates.
Helpers are provided to every view rendered using the component `renderView`
method.

Components `template` property is expected to be handlebars, and views can be
rendered through the component's renderView method.
This wil provide expected helpers and extra data to template rendering.

``` javascript
var myModule = Fossil.Module.extend({
    routes: {
        '': index
    },
    index: function () {
        var view = new Fossil.View({
            template: "{{url ''}}"
        });
        this.renderView(view);
    }
});
```

To register service on your application, do as follow:

``` javascript
var hbs = new Fossil.Services.Handlebars({
    routing: app.service.routing
});

// To register a global helper, use the registerHelper method:
// You can still register Handlebars global helpers,
// but helpers registered by service are available under the
// `component.helpers.foo` property
hbs.registerHelper('greatHelper', function () {});
Handlebars.registerHelper('foo', function () {});

// add helpers on component basis.
// each factory is a callback accepting component:
hbs.registerHelperFactory(function (component) {
    return {
        'greatHelper': function () {return component.path;}
    };
});
```

With default implementation you have a `url` helper.
