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

        handlers:[],

        initialize:function (id, type) {
            this.id=id;
            this.type = type;
        },

        navClicked:function () {
            Pubsub.publish(Events.REMOVE_ALERT);
        },

        render:function () {
            this.$el.html(this.template({id:this.id, type: this.type}));
            return this;
        }

    });

    return ParticipantNavigationView;
});