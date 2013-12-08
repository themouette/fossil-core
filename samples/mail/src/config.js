require.config({
    baseUrl: './src',
    paths: {
        'jquery': '../bower_components/jquery/jquery',
        'underscore': '../bower_components/underscore/underscore',
        'backbone': '../bower_components/backbone/backbone',
        'fossil': '../bower_components/fossil-core/src',
        'fossil/views': '../bower_components/fossil-view/src',
        'handlebars': '../bower_components/handlebars/handlebars',
        'hbars': '../bower_components/requirejs-handlebars/hbars',
        'text': '../bower_components/requirejs-text/text'
    },
    map: {
        'hbars': {'Handlebars': 'handlebars'},
        '*': {'Handlebars': 'handlebars'}
    },
    shim: {
        'underscore': {exports: '_'},
        'backbone': {deps: ['underscore', 'jquery'], exports: 'Backbone'},
        'handlebars': {exports: 'Handlebars'}
    }
});
