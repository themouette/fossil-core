define('kernel', [
    './application',
    'service.routing',
    'service.template',
    'service.canvas'
], function (Application, routing, template, canvas) {
    "use strict";


    var app = new Application();
    app
        .use('routing', routing)
        .use('template', template)
        .use('canvas', canvas)

        .start();
});
