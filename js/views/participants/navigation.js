define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'models/participant',
    'text!templates/participants/navigation.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, Participant, navigationTemplate, Pubsub) {

    /**
     * Manage sub view to navigate between participants details and edit views
     */
    return Backbone.View.extend({

        template:Handlebars.compile(navigationTemplate),

        events:{
            "click .nav-pills":"navClicked"
        },

        types:['details', 'edit', 'teams'],

        handlers:[],

        /**
         * Initialize view
         *
         * @param id id of the participant
         * @param viewType type of the main view
         */
        initialize:function (id, viewType) {
            this.id = id;
            this.viewType = viewType;
            this.handlers.push(Pubsub.subscribe(App.Events.VIEW_CHANGED, this.updatePills.bind(this)));
        },

        /**
         * Handles actions on navigation bar buttons
         *
         * @param event event raised
         */
        navClicked:function (event) {
            event.stopPropagation();
            event.preventDefault();

            // get asked main view type and, if different of the current one, ask for a change view
            var viewType = event.target.id;

            if (this.viewType != viewType) {
                this.viewType = viewType;
                Pubsub.publish(App.Events.CHANGE_VIEW, [viewType]);
                Pubsub.publish(App.Events.REMOVE_ALERT);
            }
        },

        render:function () {
            var navigable = ((this.viewType == 'details') || (this.viewType == 'edit'));
            this.$el.html(this.template({id:this.id, navigable:navigable, type:this.viewType}));
            this.initTooltips();
            return this;
        },

        initTooltips:function () {

            if (this.viewType != "add") {
                this.$el.find("div.title").tooltip({title:"drag on delete drop-zone to remove", trigger:'hover'});
                this.$el.find(".nav-pills > li:not(.active):first > a").tooltip({title:"press <code>&larr;</code> or <code>&rarr;</code> or click to navigate", trigger:'manual', placement:"bottom"});
            }
        },

        /**
         * update navigation bar depending on the main view type
         *
         * @param elemType type of the element managed by the view
         * @param viewType main view type
         */
        updatePills:function (elemType, viewType) {

            // preventive hide if any tooltip displayed
            this.$el.find(".nav-pills > li:not(.active):first > a").tooltip('hide');

            // clear pills
            this.$el.find('ul.nav-pills li').removeClass('active');

            // active the current type
            this.$el.find('ul.nav-pills li > a#' + viewType).parent().addClass('active');

            // could occur only on the first load
            if (this.viewType == viewType) {
                this.$el.find(".nav-pills > li:not(.active):first > a").tooltip('show');
                this.timeout = setTimeout(function () {
                    this.$el.find(".nav-pills > li:not(.active):first > a").tooltip('hide');
                }.bind(this), 5000);
            }

            this.viewType = viewType;
        },

        hideTooltips:function () {
            this.$el.find(".nav-pills > li > a").tooltip('hide');
            this.$el.find("div.title").tooltip('hide');
        },

        beforeClose:function () {
            this.hideTooltips();
        }

    });
});