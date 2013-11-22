define([
    'jquery', 'underscore', '../service', '../utils'
], function ($, _, Service, utils) {
    "use strict";

    var Canvas = Service.extend({
        // selector on wich to append the main canvas.
        selector: 'body',

        // Empty target selector before appening view.
        // This is useful to place a default message for not supported
        // browsers for instance.
        empty: true,

        useDeep: false,

        initialize: function (options) {
            utils.copyOption(['selector', 'empty'], this, options);
            this.currentView = {};
        },

        // Listen to `do:view:attach` event and attach given view to selector.
        //
        // It is possible to override selector on a module basis
        // by providing a selector option.
        //
        // ``` javascript
        // var canvas = new SelectorCanvas({selector: "body"});
        //
        // // default behavior
        // var module = new Module();
        // module
        //   .use('canvas', canvas); // append view to "body"
        //
        // // override on module basis
        // var module = new Module({selector: ".l-content"});
        // module
        //   .use('canvas', canvas); // append view to ".l-content"
        // ```
        use: function (module, parent) {
            // copy selector option if any.
            utils.copyOption(['selector'], module, module.options);
            // Listen to view attach event.
            module.on('do:view:attach', this.attachView, this);
        },

        dispose: function (module, parent) {
            module.off('do:view:attach', this.attachView, this);
        },

        attachView: function (module, view) {
            var selector = module.selector || this.selector;
            var $selector = $(selector);
            if (this.currentView[selector]) {
                this.currentView[selector].remove();
            }

            if (this.empty) { $selector.empty(); }

            this.currentView[selector] = view;

            $selector.append(view.$el);

            if (view._attachPlugins) {
                view._attachPlugins();
            } else if(view.attachPlugins) {
                view.attachPlugins();
            }
        }

    });

    return Canvas;
});
