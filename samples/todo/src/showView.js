define([ 'fossil/views/view' ], function (View) {

    var ShowView = View.extend({
        template: '<p><%= title %></p><%= buttonTo("List", "") %>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    return ShowView;
});
