define([
    'backbone',
    'hbs!templates/alert.html',
    'pubsub',
    'bootstrap'
], function(Backbone, alertsTemplate, Pubsub) {

    return Backbone.View.extend({

        template: alertsTemplate,

        initialize: function() {
            this.$el.addClass('row');
            Pubsub.on(App.Events.REMOVE_ALERT, this.hideAlerts, this);
            Pubsub.on(App.Events.ALERT_RAISED, this.showAlert, this);
            this.render();
        },

        hideAlerts: function() {
            this.$('.alert').fadeOut('fast');
            this.$('.alert').alert('close');
        },

        showAlert: function(title, text, klass) {
            this.$('.alert').fadeOut('fast');
            this.$('.alert').alert('close');

            this.render();
            this.$('.alert').addClass(klass);
            this.$('.alert > .message').html('<strong>' + title + '</strong> ' + text);
            this.$('.alert').fadeIn('fast');

            clearTimeout(this.timeout);
            this.timeout = setTimeout(function() {
                this.$('.alert').alert('close');
            }.bind(this), 5000);
        }

    });
});