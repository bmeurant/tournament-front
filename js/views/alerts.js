define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/alert.html',
    'pubsub',
    'bootstrap'
], function ($, _, Backbone, Handlebars, alertsTemplate, Pubsub) {

    return Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(alertsTemplate),

        events:{
        },

        handlers:[],

        initialize:function () {
            this.$el.addClass("row");
            this.handlers.push(Pubsub.subscribe(App.Events.REMOVE_ALERT, this.hideAlerts.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.ALERT_RAISED, this.showAlert.bind(this)));
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