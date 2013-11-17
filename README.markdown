Fossil core components
======================

Fossil is yet another framework built on top of
[Backbone.JS](http://backbonejs.org).

[![Build
Status](https://travis-ci.org/themouette/fossil-core.png?branch=master)](https://travis-ci.org/themouette/fossil-core)

[![Selenium Test
Status](https://saucelabs.com/buildstatus/fossil)](https://saucelabs.com/u/fossil)
[![Selenium Test
Status](https://saucelabs.com/browser-matrix/fossil.svg)](https://saucelabs.com/u/fossil)

It aims at easing and speed up development of large single page applications,
because developping Backbone application should all be about creating Views,
Models and Collections.

Fossil provides modular organization, productive views, powerful communication
features and lot more...

* [Get started](http://themouette.github.io/fossil-core/get-started.md) in a
  minute following simple examples.
* [Annotated sources](http://themouette.github.io/fossil-core/sources/) are
  available thanks to [docco](http://jashkenas.github.io/docco/).
* [samples](http://themouette.github.io/fossil-core/samples/) are provided
  to show examples of what you can achieve with Fossil.
* Run [tests](http://themouette.github.io/fossil-core/tests/) in your browser.

Install
-------

If you use bower:

`bower install fossil-core --save`

Git install:

```
$ git clone https://github.com/themouette/fossil-core.git && cd ./fossil-core && npm install
```

Usage
-----

Fossil is available as both amd module and standalone build.

``` html
<html>
    <head></head>
    <body>
        <div id="l-wrap">
        </div>
        <!--
            as standalone build
        -->
        <script src="../bower_components/fossil-core/fossil-core.gz.js" type="text/javascript" charset="utf-8"></script>

        <!-- as AMD build -->
        <!--
            You are encouraged to combine requirejs with your configuration and
            kernel. It makes html the same for production and development
            environments.
            Have a look to http://themouette.github.io/fossil-core/package-application.md
        -->
        <script src="../bower_components/requirejs/require.js" type="text/javascript" charset="utf-8"></script>
        <script type="text/javascript">
            require.config({
                baseUrl: './',
                paths: {
                    'jquery': 'bower_components/jquery/jquery',
                    'underscore': 'bower_components/underscore/underscore',
                    'backbone': 'bower_components/backbone/backbone',
                    'fossil': 'bower_components/fossil-core/src',
                    'fossil/views': 'bower_components/fossil-view/src'
                },
                shim: {
                    'underscore': {exports: '_'},
                    'backbone': {deps: ['underscore', 'jquery'], exports: 'Backbone'}
                }
            });
            require('kernel');
        </script>
    </body>
</html>
```

License
-------

Fossil is an open source project licensed under the MIT license. See
`LICENSE` file for more informations.

Commands
--------

### Testing

```
$ npm test
```

### Dev mode

It launches a local server and watcher to build project automaticaly.

```
$ npm start
```

project is available under `http://localhost:8000`

