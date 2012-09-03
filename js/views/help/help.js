define([
    'backbone',
    'hbs!templates/help/global.html',
    'hbs!templates/help/shortcuts/global.html'
], function(helpTemplate, shortcutsTemplate) {

    return Backbone.View.extend({

        attributes: {
            id: 'help',
            class: 'row'
        },

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$(helpTemplate);
            this.$('ul.shortcuts').html(shortcutsTemplate);
            return this;
        }

    });
});