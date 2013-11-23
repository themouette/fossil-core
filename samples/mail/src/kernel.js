define('kernel', [
    './application',
    'fossil/engines/handlebars',
    'fossil/services/routing',
    'fossil/services/template',
    'fossil/services/canvas'
], function (Application, Engine, Routing, Template, Canvas) {
    "use strict";

    var engine = new Engine();
    var routing = new Routing();
    var template = new Template({
        engine: engine
    });
    var canvas = new Canvas();

    var app = new Application();
    app
        .use('routing', routing)
        .use('template', template)
        .use('canvas', canvas)

        .start();
});
