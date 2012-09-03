define([
    'backbone',
    'hbs!templates/participants/paginatedList.html',
    'views/participants/list',
    'views/participants/pagination',
    'collections/participants',
    'pubsub'
], function(Backbone, paginatedListTemplate, ListView, PaginationView, ParticipantsCollection, Pubsub) {

    var PaginatedListView = Backbone.View.extend({

        template: paginatedListTemplate,
        elemType: 'participant',

        initialize: function() {
            this.collection = new ParticipantsCollection();
            this.refreshView();
            new ListView({root: this.$('.elements'), params: this.options.params, collection: this.collection});
            new PaginationView({root: this.$('.pagination'), collection: this.collection});
        },

        refreshView: function() {
            this.render();
            Pubsub.trigger(App.Events.VIEW_CHANGED, this.elemType, 'list');
            return this;
        }
    });

    return PaginatedListView;
});