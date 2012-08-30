define([
    'jquery',
    'underscore',
    'resthub-handlebars',
    'backbone',
    'models/participant',
    'hbs!templates/participants/details.html'
], function ($, _, Handlebars, Backbone, Participant, detailsTemplate) {

    return Backbone.View.extend({

        elemType: 'participant',
        viewType:'details',

        initialize:function (model) {
            this.model = model;
        },

        initBindings:function () {

        },

        render:function () {
            this.$el.html(detailsTemplate({participant:this.model.toJSON()}));

            return this;
        }

    });

})
;