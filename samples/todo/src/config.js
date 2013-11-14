require.config({
    baseUrl: './src',
    paths: {
        'jquery': '../bower_components/jquery/jquery',
        'underscore': '../bower_components/underscore/underscore',
        'backbone': '../bower_components/backbone/backbone',
        'fossil': '../bower_components/fossil-core/src',
        'fossil/views': '../bower_components/fossil-view/src'
    },
    shim: {
        'underscore': {exports: '_'},
        'backbone': {deps: ['underscore', 'jquery'], exports: 'Backbone'}
    }
});
