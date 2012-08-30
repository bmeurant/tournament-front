define([
    'backbone',
    'hbs!templates/footer.html',
    'pubsub'
], function(Backbone, footerTemplate, Pubsub) {

    return Backbone.View.extend({

        events: {
            'click p.shortcuts-menu a': 'showShortcuts'
        },

        initialize: function() {
            Pubsub.on(App.Events.HELP_CALLED, this.showHelp, this);
        },

        render: function() {
            this.$el.html(footerTemplate());
            return this;
        },

        showShortcuts: function(event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.trigger(App.Events.KEYBOARD_CALLED);
        },

        showHelp: function() {
            Backbone.history.navigate('/help', true);
        }

    });
});