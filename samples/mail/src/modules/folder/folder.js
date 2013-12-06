define([
    'fossil/utils', 'fossil/module', './view',
    '../../collections/folder'
], function (utils, Module, View, FolderCollection) {
    "use strict";

    var Folder = Module.extend({
        // the collection to use for the module.
        //
        // this is available as a module option.
        // @param Backbone.Collection
        collection: null,

        events: {
            // 'route:show' event executes method `show`.
            // This is a controller that show the folder list.
            'route:show': 'show',

            'select:folder': 'selectFolder'
        },

        routes: {
            // index view triggers route:show event.
            '': 'route:show'
        },

        initialize: function (options) {
            utils.copyOption(['collection'], this, options);
        },

        prepareFolders: function () {
            if (!this.folders) {
                this.folders = new FolderCollection({
                    type: this.type
                });
            }

            if (!this.folders.loaded) {

                this
                    .abort()
                    .useView('loading')
                    .waitFor(this.folders)
                    .waitFor(this.folders.fetch());

                this.folders.loaded = true;
            } else {
                this
                    .waitFor(this.folders);
            }

            return this;
        },

        // the main controller.
        // Show the folder list view.
        //
        // @param region the region to use as display
        show: function (region) {
            this
                .prepareFolders()
                .thenWith(this, function (folders) {
                    // create view
                    var view = this.view = new View({
                        collection: folders,
                        className: 'mod-folders'
                    });

                    return this.render(view).attach(view, region);
                }, this.showError);
        },

        showError: function (error) {
            this.useView(new View({
                template: 'Une erreur est survenue'
            }));
        },

        selectFolder: function (id) {
            this.view.selectFolder(id);
            console.log('select folder %s', id);
        }
    });

    return Folder;
});

