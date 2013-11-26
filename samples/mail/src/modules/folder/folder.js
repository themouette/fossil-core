define([
    'fossil/module', './view'
], function (Module, View) {
    "use strict";

    var Folder = Module.extend({
        events: {
            // 'route:show' event executes method `show`.
            // This is a controller that show the folder list.
            'route:show': 'show'
        },

        routes: {
            // index view triggers route:show event.
            '': 'route:show'
        },

        // the main controller.
        // Show the folder list view.
        //
        // @param FolderCollection folders collection of folders to display
        show: function (folders) {
            // create view
            var view = new View({
                collection: folders,
                className: 'mod-folders'
            });

            return this.useView(view);
        }
    });

    return Folder;
});

