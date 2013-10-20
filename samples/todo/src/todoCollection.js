define(['backbone', 'todo'], function (Backbone, Todo) {
    return Backbone.Collection.extend({
        model: Todo,
        url: '/tasks.json'
    });
});
