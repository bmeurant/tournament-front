define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/navigation.html',
    'pubsub'
], function ($, _, Backbone, Participant, navigationTemplate, Pubsub) {
    var ParticipantNavigationView = Backbone.View.extend({

        template:_.template(navigationTemplate),

        events:{
            "click .nav-pills":"navClicked"
        },

        types:['details', 'edit', 'teams'],

        handlers:[],

        initialize:function (id, type) {
            this.id = id;
            this.type = type;
            this.handlers.push(Pubsub.subscribe(Events.VIEW_CHANGED, this.updatePills.bind(this)));
        },

        navClicked:function (event) {
            event.stopPropagation();
            event.preventDefault();

            var type = event.target.id;

            if (this.type != type) {
                this.type = type;
                Pubsub.publish(Events.CHANGE_VIEW, [type]);
                Pubsub.publish(Events.REMOVE_ALERT);
            }
        },

        render:function () {
            this.$el.html(this.template({id:this.id, type:this.type}));
            return this;
        },

        updatePills: function (type) {

            // clear pills
            $('ul.nav-pills li').removeClass('active');

            // active the current type
            $('ul.nav-pills li > a#'+type).parent().addClass('active');
        }

    });

    return ParticipantNavigationView;
});