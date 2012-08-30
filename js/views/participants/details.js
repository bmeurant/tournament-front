define([
    'jquery',
    'underscore',
    'resthub-handlebars',
    'backbone',
    'models/participant',
    'hbs!templates/participants/details.html',
    'pubsub'
], function($, _, Handlebars, Backbone, Participant, detailsTemplate, Pubsub) {

    return Backbone.View.extend({

        elemType: 'participant',
        viewType: 'details',

        initialize: function() {
            this.model.on("sync", this.render.bind(this));
        },

        render: function() {
            this.$el.html(detailsTemplate({participant: this.model.toJSON()}));
            return this;
        }

    });

})
;