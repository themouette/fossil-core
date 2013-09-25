Dev
---

* add the ability to register own helpers and helperFactories.
* Document Handlebars service.
* Handlebars service relies on router (to register `url` helpers). Maybe not definitive.
* Handlebars adapter url helper accepts several parameters.
* `grunt dev` build dev environment first.
* Bugfix: service link to application error.
* `Fossil.Mixins.Deferrable` can wait for non promise values.

2013-08-12 version 0.0.3
------------------------

* Introduces Handlebars adapter.
* Introduces `Fossil.View`.
* `Fossil.Mixins.Layoutable`: Does not execute template function anymore, assume
  it is a compiled template. Method is no more evaluated in Layoutable context.
* `Fossil.Mixins.Layoutable`: Backbone.View used as template behave like native
  views and are append using `setElement`.
* No more needs for application parameter on Modules.
  It is set on application connection. Introduces the `connect` event for
  modules.
* Services `expose` config option exposes methods. Service itself is always
  exposed on service property.
* `Fossil.Mixins.Layoutable`: Introduce `setLayout`, a method to set/replace layout.
* `Fossil.Mixins.Fragmentables`: accepts `fragments` option.
