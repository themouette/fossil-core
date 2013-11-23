define([
    'underscore',
    'fossil/module', 'fossil/views/regionManager',
    'txt!templates/layout'
], function (_, Module, RegionManager, layoutTpl) {
    "use strict";

    var Application = Module.extend({
        events: {
            start: 'startListener',
            // forwarded attach events
            'do:view:attach:folder': 'attachLeft',
            'do:view:attach:conversation': 'attachMain',
            'do:view:attach:compose': 'attachMain'
        },

        initialize: function () {
            // connect modules
        },

        startListener: function () {
            this.initCanvas();
            this.forwardModuleAttach();
        },

        initCanvas: function () {
            this.canvas = new RegionManager({
                regions: {
                    'left': 'section[data-fossil-region=left]',
                    'main': 'section[data-fossil-region=main]'
                },
                template: layoutTpl,
                managerRendering: false
            });

            this.useView(this.canvas);

            return this.canvas;
        },

        forwardModuleAttach: function () {
            _.each([
                'folder', 'conversation', 'compose'
            ], function(id) {
                this.modules[id].forward('do:view:attach', 'parent!do:view:attach:'+id);
            }, this);
        },

        attachLeft: function (view) {
            this.canvas.registerView(view, 'left');
        },
        attachMain: function (view) {
            this.canvas.registerView(view, 'main');
        }
    });

    return Application;
});
