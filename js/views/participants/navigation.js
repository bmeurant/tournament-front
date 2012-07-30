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
        },

        handlers:[],

        initialize:function () {
        },

        render:function () {
            this.$el.html(this.navigationTemplate({participant:this.model.toJSON()}));

        }

    });

    return ParticipantNavigationView;
});