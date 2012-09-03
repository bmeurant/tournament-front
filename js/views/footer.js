define([
    'backbone',
    'hbs!templates/footer.html',
    'pubsub'
], function(Backbone, footerTemplate, Pubsub) {

    return Backbone.View.extend({

        template: footerTemplate,

        events: {
            'click p.shortcuts-menu a': 'showShortcuts'
        },

        initialize: function() {
            Pubsub.on(App.Events.HELP_CALLED, this.showHelp, this);
            this.render();
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