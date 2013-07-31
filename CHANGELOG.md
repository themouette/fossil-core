dev
---

* No more needs for application parameter on Modules.
  It is set on application connection. Introduces the `connect` event for
  modules.
* Services `expose` config option exposes methods. Service itself is always
  exposed on service property.
* `Fossil.Mixins.Layoutable`: Introduce `setLayout`, a method to set/replace layout.
* `Fossil.Mixins.Fragmentables`: accepts `fragments` option.
