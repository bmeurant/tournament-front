define([
    'backbone',
    'hbs!templates/participants/details.html'
], function(Backbone, detailsTemplate) {

    var DetailsView = Backbone.View.extend({

        elemType: 'participant',
        viewType: 'details',
        template: detailsTemplate,

        initialize: function() {
            this.model.on("sync", this.render, this);
        },

        render: function() {
            return DetailsView.__super__.render.apply(this);
        }
    });

    return DetailsView;
});