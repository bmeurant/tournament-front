define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'hbs!templates/help/global.html',
    'hbs!templates/help/shortcuts/global.html'
], function($, _, Backbone, Handlebars, helpTemplate, shortcutsTemplate) {

    return Backbone.View.extend({

        initialize: function() {
            this.$el.addClass('row').attr('id', 'help');
        },

        render: function() {
            this.$el.html(helpTemplate);
            this.$el.find('ul.shortcuts').html(shortcutsTemplate);
            return this;
        }

    });
});