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

    var PaginationView = Backbone.View.extend({

        template:Handlebars.compile(paginationTemplate),

        handlers:[],

        events:{
            "click a":"changePage"
        },

        type:'pagination',

        initialize:function () {

            this.handlers.push(Pubsub.subscribe(Events.PAGE_UP_CALLED, this.previousPage.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PAGE_DOWN_CALLED, this.nextPage.bind(this)));

        },

        initBindings:function () {

        },

        render:function (collection) {
            this.collection = collection;

            this.$el.html(this.template({info:this.collection.info(), firstPage:this.collection.paginator_ui.firstPage}));

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

            Pubsub.publish(Events.NEW_PAGE, [pageId]);

        },

        previousPage:function (event) {

            event.stopPropagation();
            event.preventDefault();

            if (this.collection.info().prev) {
                Pubsub.publish(Events.NEW_PAGE, [this.collection.info().prev]);
            }
        },

        nextPage:function (event) {

            event.stopPropagation();
            event.preventDefault();

            if (this.collection.info().next) {
                Pubsub.publish(Events.NEW_PAGE, [this.collection.info().next]);
            }
        }

    });

    return PaginationView;
})
;