Fossil.Mixins.Layoutable
========================

Add the ability to use a layout for an element.
Layout is declared in `template` property or option.

> This mixin is based on `Observable` and `Elementable`

Usage
-----

### Initial template

Give template option or set template on prototype:

``` !javascript
var Layoutable = function Layoutable(options) {
    this.options = options || {};
    this.initLayoutable();
}
_.extend(
    Layoutable.prototype,
    Fossil.Mixins.Observable,
    Fossil.Mixins.Elementable,
    Fossil.Mixins.Layoutable, {
    // default template
    template: 'my template'
});

var myLayout = new Layoutable({
    // override template
    template: 'override template'
});
```

### Replace template

Use method `setLayout`.
Layout will be automaticaly rendered.

``` !javascript
Layoutable.setLayout(template);
Layoutable.setLayout(myView, true); // to recycle view (ie do not rerender)
```

### Render template

To render template in the root element, all you need is to call `renderLayout`.

### Clean ayout

To clean element, just use `removeLayout`.

Template types
--------------

Template can be of several types. In every case, the template is converted to a
Fossil.View, and Layoutable element is used as view element (using `setElement`).
THis view is rendered using Layoutable's `renderView` method if available. If
not, a basic `render` is called on the view.

Here is the process to convert template to Fossil.View, depending on template
type.

### string

A new Fossil.View is created, using the string as template.

### function

A new Fossil.View is created, using the function as template.

### Null

The current dom is used as a template.

### Backbone.View / Fossil.View

The view is used as is (setElement is called directly on it)

### Render object

The object is instanciated and render method is used a template.

Render process
--------------

If a `renderView` method is provided, it will be used to render template view.
It enable the template engine and helpers in the rendering process.

