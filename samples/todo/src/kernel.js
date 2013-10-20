define('kernel', [
    './application',
    'fossil/engines/underscore',
    'fossil/services/routing',
    'fossil/services/template',
    'fossil/services/canvas'
], function (Application, Engine, Routing, Template, Canvas) {

    var engine = new Engine();
    var routing = new Routing();
    var template = new Template({
        engine: engine
    });
    var canvas = new Canvas({
        selector: '#l-wrap'
    });

    var app = new Application({
        region: 'content'
    });
    app
        .use('routing', routing)
        .use('template', template)
        .use('canvas', canvas)
        .on('start:first', function () {
            canvas.canvas.defineRegion('content', '.content');
        })
        .start();
});
