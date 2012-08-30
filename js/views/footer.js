define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'hbs!templates/footer.html',
    'pubsub'
], function($, _, Backbone, Handlebars, footerTemplate, Pubsub) {

    return Backbone.View.extend({

        events: {
            'click p.shortcuts-menu a': 'showShortcuts'
        },

        initialize: function() {
        },

        render: function() {
            this.$el.html(footerTemplate());
            return this;
        },

        showShortcuts: function(event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.trigger(App.Events.KEYBOARD_CALLED);
        }

    });
});