define([
    'jquery',
    'underscore',
    'resthub-handlebars',
    'backbone',
    'models/participant',
    'text!templates/participants/details.html'
], function ($, _, Handlebars, Backbone, Participant, detailsTemplate) {

    return Backbone.View.extend({

        template:Handlebars.compile(detailsTemplate),

        handlers:[],

        events:{

        },

        elemType: 'participant',
        viewType:'details',

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

})
;