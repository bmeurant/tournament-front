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


            Handlebars.registerHelper('pages', function (items, options) {

                var info = this.collection.info();
                var klass;

                var out = "<ul>";

                out = out + "<li class=" + (info.prev ? '' : 'disabled') + "><a href='?page=" + info.prev + "' >< Prev</a></li>";
                for (var i = 1; i <= info.totalPages; i++) {
                    klass = (info.currentPage == i) ? "active" : "";
                    out = out + "<li class=" + klass + "><a href='?page=" + i + "' >" + i + "</a></li>";
                }
                out = out + "<li class=" + (info.next ? '' : 'disabled') + "><a href='?page=" + info.next + "' >Next ></a></li>";

                return new Handlebars.SafeString(out + "</ul>");
            }.bind(this));
        },

        initBindings:function () {

        },

        render:function (collection) {
            this.collection = collection;

            this.$el.html(this.template());

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