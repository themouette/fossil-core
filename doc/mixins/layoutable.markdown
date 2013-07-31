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
    Startable.prototype,
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

### Render template

To render template in the root element, all you need is to call `renderLayout`.

### Clean ayout

To clean element, just use `removeLayout`.
