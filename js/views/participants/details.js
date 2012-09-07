define([
    'backbone',
    'hbs!templates/participants/details.html',
    'i18n!nls/messages'
], function(Backbone, detailsTemplate, messages) {

    var DetailsView = Backbone.View.extend({

        elemType: 'participant',
        viewType: 'details',
        template: detailsTemplate,

        initialize: function() {
            this.model.on("sync", this.render, this);
        },

        render: function() {
            return DetailsView.__super__.render.apply(this, [{messages: messages, participant: this.model.toJSON()}]);
        }
    });

    return DetailsView;
});