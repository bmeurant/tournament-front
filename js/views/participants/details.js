define([
    'jquery',
    'underscore',
    'handlebars',
    'backbone',
    'models/participant',
    'text!templates/participants/details.html'
], function ($, _, Handlebars, Backbone, Participant, detailsTemplate) {

    var ParticipantDetailsView = Backbone.View.extend({

        template:Handlebars.compile(detailsTemplate),

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
            this.$el.html(this.template({participant:this.model.toJSON()}));

            return this;
        }

    });

    return ParticipantDetailsView;
})
;