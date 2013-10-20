define([ 'fossil/views/view' ], function (View) {

    var ShowView = View.extend({
        template: '<p><%= title %></p><a href="#">List</a>',
        getViewData: function () {
            return this.model.toJSON();
        }
    });

    return ShowView;
});
