define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'backbone-paginator',
    'collections/participants',
    'hbs!templates/participants/pagination.html',
    'pubsub'
], function($, _, Backbone, Handlebars, BackbonePaginator, ParticipantsCollection, paginationTemplate, Pubsub) {

    return Backbone.View.extend({

        events: {
            'click a': 'changePage'
        },

        viewType: 'pagination',

        initialize: function() {

            Pubsub.on(App.Events.PAGE_UP_CALLED, this.previousPage, this);
            Pubsub.on(App.Events.PAGE_DOWN_CALLED, this.nextPage, this);

        },

        initBindings: function() {

        },

        render: function(collection) {
            this.collection = collection;

            this.$el.html(paginationTemplate({info: this.collection.info(), firstPage: this.collection.paginator_ui.firstPage}));

            return this;
        },

        changePage: function(event) {
            event.stopPropagation();
            event.preventDefault();

            var target = event.currentTarget;
            var pattern = 'page=';
            var href = $(target).attr('href');
            var pageId = href.substring(href.indexOf(pattern) + pattern.length);
            if (pageId.indexOf('&') >= 0) {
                pageId = pageId.substring(0, pageId.indexOf('&'));
            }

            Pubsub.trigger(App.Events.NEW_PAGE, pageId);

        },

        /**
         * switch to previous page
         *
         * @param event
         * @param selectLast boolean - true if the last element of the previous page should be selected
         */
        previousPage: function(event, selectLast) {

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (this.elemCollection.info().previous) {
                Pubsub.trigger(App.Events.NEW_PAGE, this.collection.info().previous, selectLast);
            }
        },

        nextPage: function(event) {

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (this.elemCollection.info().next) {
                Pubsub.trigger(App.Events.NEW_PAGE, this.collection.info().next);
            }
        }

    });
});