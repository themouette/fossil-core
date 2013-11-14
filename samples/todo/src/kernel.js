define('kernel', [
    'jquery',
    './application',
    'fossil/engines/underscore',
    'fossil/services/routing',
    'fossil/services/template',
    'fossil/services/canvas'
], function ($, Application, Engine, Routing, Template, Canvas) {

    var engine = new Engine();
    var routing = new Routing();
    var template = new Template({
        engine: engine
    });
    var canvas = new Canvas({
        selector: '#l-wrap'
    });

    template.helper('url', function () {
        // last argument is always the extra data.
        // extra data are as follow:
        // {
        //     helpers: {/* list of all available helpers */},
        //     data: {
        //         view: /* the current rendering view, be careful with nesting rendering as it will be the parent view */,
        //         module: /* the current rendering module */
        //     }
        // }
        var extra = _.last(arguments);
        // fragments are all but the last argument
        var fragments = _.initial(arguments, 1);
        // module `url` is computed by Routing service from module urlRoot option
        // and parent modules.
        return '#' + (extra.data.module.url || '' ) + fragments.join('');
    });
    template.helper('linkTo', function (title, url) {
        var extra = _.last(arguments);
        // fragments are all but title and extra arguments
        var fragments = _.initial(_.tail(arguments));
        return '<a href="' + extra.helpers.url.apply(this, fragments) +'">'+title+'</a>';
    });
    template.helper('buttonTo', function (title, url) {
        var id = "b_"+_.uniqueId();
        var extra = _.last(arguments);
        var view = extra.data.view;
        var module = extra.data.module;
        url = extra.helpers.url(url);

        view.once('on:plugins:attach', function () {
            $('button[data-fossil-id='+id+']').on('click', _.bind(module.navigate, module, url, {trigger: true, replace: true}));

            view.once('on:plugins:detach', function () {
                $('button[data-fossil-id='+id+']').off('click');
            });
        });

        return '<button data-fossil-id="'+id+'">'+title+'</button>';
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
