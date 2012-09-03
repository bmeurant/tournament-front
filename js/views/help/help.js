define([
    'backbone',
    'hbs!templates/help/global.html',
    'hbs!templates/help/shortcuts/global.html'
], function(Backbone, helpTemplate, shortcutsTemplate) {

    var HelpView =  Backbone.View.extend({

        template: helpTemplate,

        attributes: {
            id: 'help',
            class: 'row'
        },

        initialize: function() {
            this.render();
        },

        render: function() {
            HelpView.__super__.render.apply(this, arguments);
            this.$('ul.shortcuts').html(shortcutsTemplate);
            return this;
        }
    });

    return HelpView;
});