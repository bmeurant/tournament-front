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
    var ParticipantNavigationView = Backbone.View.extend({

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
         * @param type type of the main view
         */
        initialize:function (id, type) {
            this.id = id;
            this.type = type;
            this.handlers.push(Pubsub.subscribe(Events.VIEW_CHANGED, this.updatePills.bind(this)));

            var self = this;

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
            var type = event.target.id;

            if (this.type != type) {
                this.type = type;
                Pubsub.publish(Events.CHANGE_VIEW, [type]);
                Pubsub.publish(Events.REMOVE_ALERT);
            }
        },

        render:function () {
            var navigable = ((this.type == 'details') || (this.type == 'edit'));
            this.$el.html(this.template({id:this.id, navigable: navigable, type:this.type}));
            return this;
        },

        /**
         * update navigation bar depending on the main view type
         *
         * @param type main view type
         */
        updatePills:function (type) {

            // clear pills
            $('ul.nav-pills li').removeClass('active');

            // active the current type
            $('ul.nav-pills li > a#' + type).parent().addClass('active');
        }

    });

    return ParticipantNavigationView;
});