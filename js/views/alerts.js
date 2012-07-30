define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/alerts.html',
    'pubsub'
], function ($, _, Backbone, alertsTemplate, Pubsub) {

    var alertsView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:_.template(alertsTemplate),

        events:{
        },

        handlers:[],

        initialize:function (el) {
            this.setElement(el);
            this.handlers.push(Pubsub.subscribe(Events.REMOVE_ALERT, this.hideAlerts.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ALERT_RAISED, this.showAlert.bind(this)));
            this.render();
        },

        render:function () {
            this.$el.html(this.template());
        },

        hideAlerts:function () {
            $('.alert').hide();
        },

        showAlert:function (title, text, klass) {
            $('.alert').removeClass("alert-error alert-warning alert-success alert-info");
            $('.alert').addClass(klass);
            $('.alert').html('<strong>' + title + '</strong> ' + text);
            $('.alert').show();
        }

    });
    return alertsView;
})
;