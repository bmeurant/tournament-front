define([
    'backbone',
    'hbs!templates/participants/paginatedList.html',
    'views/participants/list',
    'views/participants/pagination',
    'collections/participants',
    'pubsub'
], function(Backbone, paginatedListTemplate, ListItemsView, PaginationView, ParticipantsCollection, Pubsub) {

    return Backbone.View.extend({

        elemType: 'participant',

        initialize: function(params) {
            this.collection = new ParticipantsCollection;
            this.listView = new ListItemsView(params, this.collection);
            this.paginationView = new PaginationView(this.collection);
            this.render();
        },

        render: function() {
            this.$el.html(paginatedListTemplate());
            this.$el.find('.elements').html(this.listView.el);
            this.$el.find('.pagination').html(this.paginationView.el);

            Pubsub.trigger(App.Events.VIEW_CHANGED, this.elemType, 'list');
            return this;
        }

    });
});