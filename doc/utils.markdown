Utils
=====

A set of functions to do recuring tasks.

## Usage

``` js
define(['fossil/utils'], function (utils) {
    // do amazing stuff.
});
```

## Methods

* `scalarOrArray`: decorate a method to allow first agument to be an array
  instead of a scalar. Method will be called as many time as required. Note that
  extra arguments are preserved.
* `keyValueOrObject`: decorate a method to allow first agument to be an object
  instead of `key, value`. Method will be called as many time as required. Note
  that extra arguments are preserved.
* `copyOption(property, to, from)`: copy `property` from `from` to `to` if
  `fom[property]` is defined. This method accepts and array of properties.
* `getProperty(key, from, alt)`: evaluate deep properties from dot notation key.
  `getProperty('a.b.c', val, 'default')` returns `val.a.b.c` or 'default' if
  value is not defined. This method accepts and array of properties.
* `setProperty(key, value, to)`: deeply set property `to`'s `key` property to
  `value`.

Report to test suite and annotated source code if you want to know more.
