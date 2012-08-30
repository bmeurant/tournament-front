define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'hbs!templates/help/global.html',
    'hbs!templates/help/shortcuts/global.html'
], function($, _, Backbone, Handlebars, helpTemplate, shortcutsTemplate) {

    return Backbone.View.extend({

        attributes: {
            id: 'help',
            class: 'row'
        },

        render: function() {
            this.$el.html(helpTemplate);
            this.$el.find('ul.shortcuts').html(shortcutsTemplate);
            return this;
        }

    });
});