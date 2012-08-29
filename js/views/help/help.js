define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'text!templates/help/global.html',
    'text!templates/help/shortcuts/global.html'
], function ($, _, Backbone, Handlebars, helpTemplate, shortcutsTemplate) {

    return Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(helpTemplate),
        shortcutsTemplate:Handlebars.compile(shortcutsTemplate),

        initialize:function () {
            this.$el.addClass('row').attr('id', 'help');
        },

        render:function () {
            this.$el.html(this.template());
            this.$el.find('ul.shortcuts').html(this.shortcutsTemplate);
            return this;
        }

    });
});