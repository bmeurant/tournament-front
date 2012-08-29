define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'text!templates/alert.html',
    'pubsub',
    'bootstrap'
], function ($, _, Backbone, Handlebars, alertsTemplate, Pubsub) {

    return Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(alertsTemplate),

        initialize:function () {
            this.$el.addClass("row");
            Pubsub.on(App.Events.REMOVE_ALERT, this.hideAlerts, this);
            Pubsub.on(App.Events.ALERT_RAISED, this.showAlert, this);
        },

        render:function () {
            this.$el.html(this.template());
            return this;
        },

        hideAlerts:function () {
            $(".alert").fadeOut('fast');
            $(".alert").alert('close');
        },

        showAlert:function (title, text, klass) {
            $(".alert").fadeOut('fast');
            $(".alert").alert('close');

            this.render();
            $('.alert').addClass(klass);
            $('.alert > .message').html('<strong>' + title + '</strong> ' + text);
            $(".alert").fadeIn('fast');

            clearTimeout(this.timeout);
            this.timeout = setTimeout(function () {
                $(".alert").alert('close');
            }.bind(this), 5000);
        }

    });
});