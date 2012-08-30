define([
    'backbone',
    'hbs!templates/participants/details.html'
], function(Backbone, detailsTemplate) {

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