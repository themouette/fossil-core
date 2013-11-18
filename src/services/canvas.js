define([
    'jquery', 'underscore', '../service', '../utils', 'fossil/views/regionManager'
], function ($, _, Service, utils, Region) {
    "use strict";

    var Canvas = Service.extend({
        // selector on wich to append the main canvas.
        selector: 'body',

        // the main application canvas
        canvas: null,

        useDeep: true,

        initialize: function (options) {
            utils.copyOption(['selector', 'canvas'], this, options);
            if (!this.canvas) {
                this.canvas = new Region({
                    template: $(this.selector).html(),
                    manageRendering: false
                });
            }
        },

        // Manage application canvases.
        //
        // It is possible to provide a canvas property at any level (module or
        // service), and it will be used as container for children and module
        // rendering.
        // If no canvas is declared in your application, service creates one
        // from service.selector html content.
        //
        // module.region property is used to provide the region name to render
        // on.
        //
        //
        //
        // case module is root:
        //  * render service canvas on module start.
        //  * append service canvas to selector
        // case canvas is provided:
        //  * render canvas on module start
        //  * append canvas to container canvas
        // case no canvas
        //  * copy parent canvas to module.canvas
        // always:
        //  * use module.region as target region on module canvas
        //
        use: function (module, parent) {
            // parent container for module canvas, or view if none provided
            var container = (parent && parent.canvas) || this.canvas;
            // region to store canvas on container
            var canvasRegion = module.containerRegion || (parent && parent.region);

            utils.copyOption(['region'], module, module.options);

            // case module is root:
            // bind service canvas rendering and attachement
            if (!parent) {
                if (module.run) {
                    // module is started
                    this.renderAndAppendService(module);
                } else {
                    // attach on start event
                    module.on('start', this.renderAndAppendService, this);
                }
            }

            // case canvas is provided:
            //  * render canvas on module start
            //  * append canvas to container canvas
            if (module.canvas) {

                if (module.run) {
                    // module is started
                    this.renderAndAppendCanvas(canvasRegion, module, container);
                } else {
                    // attach on start event
                    module.on('start', _.bind(this.renderAndAppendCanvas, this, canvasRegion, module, container), this);
                }

            // case no canvas
            //  * copy parent canvas to module.canvas
            } else {
                module.canvas = container;
            }

            // always:
            //  * use module.region as target region on module canvas
            module.on('do:view:attach', this.attachView, this);
        },

        dispose: function (module, parent) {
            if (!parent) {
                this.disposeRoot(module);
            } else {
                this.disposeRegion(module, parent);
            }
        },

        // render service canvas on module start.
        // append service canvas to selector
        renderAndAppendService: function (module) {
            this.canvas.setElement(this.selector);
            module.render(this.canvas);
        },

        renderAndAppendCanvas: function (region, module, container) {
            module.render(module.canvas);
            container.registerView(module.canvas, region);
        },

        attachView: function (module, view) {
            var canvas = module.canvas || this.canvas;
            canvas.registerView(view, module.region);
        },

        // Following cases are faced:
        // case module is root:
        //  * canvas provided: use as canvas and append it to service
        //  * no canvas: use service canvas
        // case module is child
        //  * canvas provided: use as canvas and append it to parent
        //  * no canvas: copy parent canvas
        useRegion: function (module, parent) {
            var canvas = (parent && parent.canvas) || this.canvas;
            if (module.canvas) {

            } else if (parent) {
                // append module canvas to parent canvas
                parent.attach(canvas);
            }
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
