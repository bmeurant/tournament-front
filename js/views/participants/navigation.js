define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
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
            this.handlers.push(Pubsub.subscribe(Events.VIEW_CHANGED, this.updatePills.bind(this)));
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
                Pubsub.publish(Events.CHANGE_VIEW, [viewType]);
                Pubsub.publish(Events.REMOVE_ALERT);
            }
        },

        render:function () {
            var navigable = ((this.viewType == 'details') || (this.viewType == 'edit'));
            this.$el.html(this.template({id:this.id, navigable: navigable, type:this.viewType}));
            return this;
        },

        /**
         * update navigation bar depending on the main view type
         *
         * @param elemType type of the element managed by the view
         * @param viewType main view type
         */
        updatePills:function (elemType, viewType) {

            // clear pills
            $('ul.nav-pills li').removeClass('active');

            // active the current type
            $('ul.nav-pills li > a#' + viewType).parent().addClass('active');
        }

    });
});