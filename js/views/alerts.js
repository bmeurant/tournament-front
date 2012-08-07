define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/alerts.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, alertsTemplate, Pubsub) {

    var AlertsView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(alertsTemplate),

        events:{
        },

        handlers:[],

        initialize:function () {
            this.$el.addClass("row");
            this.handlers.push(Pubsub.subscribe(Events.REMOVE_ALERT, this.hideAlerts.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ALERT_RAISED, this.showAlert.bind(this)));
        },

        render:function () {
            this.$el.html(this.template());
            return this;
        },

        hideAlerts:function () {
            $('.alert').hide();
        },

        showAlert:function (title, text, klass) {
            $('.alert').removeClass("alert-error alert-warning alert-success alert-info");
            $('.alert').addClass(klass);
            $('.alert').html('<strong>' + title + '</strong> ' + text);
            $('.alert').show();
            setTimeout(function () {
                $('.alert').hide();
            }.bind(this), 3000);
        }

    });
    return AlertsView;
});