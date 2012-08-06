define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/details.html'
], function ($, _, Backbone, Participant, detailsTemplate) {

    var ParticipantDetailsView = Backbone.View.extend({

        template:_.template(detailsTemplate),

        handlers:[],

        events:{

        },

        type:'details',

        initialize:function (model) {
            this.model = model;
        },

        initBindings:function () {

        },

        render:function () {
            this.$el.html(this.template({participant:this.model.toJSON(), 'server_url':"http://localhost:3000/api"}));

            return this;
        }

    });

    return ParticipantDetailsView;
})
;