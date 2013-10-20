define('kernel', [
    './application',
    'fossil/engines/underscore',
    'fossil/services/routing',
    'fossil/services/template',
    'fossil/services/canvas'
], function (Application, Engine, Routing, Template, Canvas) {

    var engine = new Engine();
    var routing = new Routing();
    var template = new Template();
    var canvas = new Canvas();

    var app = new Application();
    app
        .use('routing', routing)
        .use('template', template)
        .use('canvas', canvas)
        .start();
});
