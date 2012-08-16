define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'backbone-paginator',
    'collections/participants',
    'text!templates/participants/pagination.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, BackbonePaginator, ParticipantsCollection, paginationTemplate, Pubsub) {

    return Backbone.View.extend({

        template:Handlebars.compile(paginationTemplate),

        handlers:[],

        events:{
            "click a":"changePage"
        },

        viewType:'pagination',

        initialize:function () {

            this.handlers.push(Pubsub.subscribe(App.Events.PAGE_UP_CALLED, this.previousPage.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.PAGE_DOWN_CALLED, this.nextPage.bind(this)));

        },

        initBindings:function () {

        },

        render:function (collection) {
            this.collection = collection;

            this.$el.html(this.template({currentPage: this.collection.currentPage, prev:this.collection.prev, next: this.collection.next, totalPages: this.collection.totalPages, firstPage:this.collection.paginator_ui.firstPage}));

            return this;
        },

        changePage:function (event) {
            event.stopPropagation();
            event.preventDefault();

            var target = event.currentTarget;
            var pattern = "page=";
            var href = $(target).attr("href");
            var pageId = href.substring(href.indexOf(pattern) + pattern.length);
            if (pageId.indexOf("&") >= 0) {
                pageId = pageId.substring(0, pageId.indexOf("&"));
            }

            Pubsub.publish(App.Events.NEW_PAGE, [pageId]);

        },

        /**
         * switch to previous page
         *
         * @param event
         * @param selectLast boolean - true if the last element of the previous page should be selected
         */
        previousPage:function (event, selectLast) {

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (this.collection.prev) {
                Pubsub.publish(App.Events.NEW_PAGE, [this.collection.prev, selectLast]);
            }
        },

        nextPage:function (event) {

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (this.collection.next) {
                Pubsub.publish(App.Events.NEW_PAGE, [this.collection.next]);
            }
        }

    });
});