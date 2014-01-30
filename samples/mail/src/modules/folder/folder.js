define([
    'backbone',
    'fossil/utils', 'fossil/module', './view',
    '../../collections/folder'
], function (Backbone, utils, Module, View, FolderCollection) {
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

            // command to select folder.
            'do:select:folder': 'selectFolder'
        },

        routes: {
            // index view triggers route:show event.
            '': 'route:show'
        },

        initialize: function (options) {
            utils.copyOption(['collection'], this, options);
        },

        // fetch folder collection
        prepareFolders: function (region) {
            var folders = this.folders;

            if (!folders) {
                folders = this.folders = new FolderCollection({
                    type: this.type
                });
            }


            if (!folders.loaded) {

                this
                    .useView('loading', region)
                    .waitForFetch(folders)
                    .then(null, function folderFetchError() {folders.loaded = false;});

                folders.loaded = true;
            }
            else {
                this
                    .waitFor(folders);
            }

            return this;
        },

        // a model to store module state.
        //
        // * selected: the selected folder uri.
        //
        // return Backbone.Model
        prepareStateModel: function () {
            if (!this.stateModel) {
                this.stateModel = new Backbone.Model({
                    selected: null
                });
            }

            return this.stateModel;
        },

        // listen to 'do:select:folder'
        //
        // Set stateModel 'select' value.
        selectFolder: function (id) {
            var stateModel = this.prepareStateModel();
            stateModel.set('selected', id);
        },

        // the main controller.
        // Show the folder list view.
        //
        // @param region the region to use as display
        show: function (region) {
            this
                .abort()
                // region is passed to append loading view in the same region.
                .prepareFolders(region)
                .thenWith(this, this.renderShow, this.showError, null, region);
        },

        renderShow: function (region, folders) {
            var stateModel = this.prepareStateModel();
            // create view
            var view = this.view = new View({
                collection: folders,
                className: 'mod-folders',
                model: stateModel
            });

            return this.render(view).attach(view, region);
        },

        showError: function (region, error) {
            this.useView(new View({
                template: 'Une erreur est survenue'
            }));
        }
    });

    return Folder;
});

