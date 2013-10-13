define(['jquery', '../service', '../utils'], function ($, Service, utils) {

    var Canvas = Service.extend({
        // selector on wich to append the main canvas.
        selector: 'body',

        // the main application canvas
        canvas: null,

        useDeep: true,

        initialize: function (options) {
            utils.copyOption(['selector', 'canvas'], this, options);
        },

        use: function (module, parent) {
            if (!parent) {
                this.useRoot(module);
            }

            this.useRegion(module, parent);
        },

        dispose: function (module, parent) {
            this.disposeRegion(module, parent);

            if (!parent) {
                this.disposeRoot(module);
            }
        },

        // render canvas on
        useRoot: function (module) {
            module.on('start:first', function (module) {
                this.canvas.setElement(this.selector);
                module.renderView(this.canvas);
            }, this);
        },

        useRegion: function (module, parent) {
            // attach on canvas
            module.on('do:view:attach', function (module, view) {
                var canvas = module.canvas || (parent && parent.canvas) || this.canvas;
                canvas.registerView(view, module.region);
            }, this);
        },

        disposeRoot: function (module) {
            module.off('start:first', null, this);
        },

        disposeRegion: function (module, parent) {
            module.off('do:view:attach', null, this);
        }
    });

    return Canvas;
});
