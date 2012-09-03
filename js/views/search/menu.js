define([
    'backbone',
    'hbs!templates/search/menu.html'
], function(Backbone, searchMenuTemplate) {

    return Backbone.View.extend({

        template: searchMenuTemplate,

        tagName: 'form',
        attributes: {
            class: 'nav navbar-search pull-right dropdown'
        },

        events: {
            'keydown #searchText': 'onKeyDown'
        },

        initialize: function() {
            this.render();
        },

        onKeyDown: function(event) {
            if (event.which == 27) {
                event.stopPropagation();
                event.preventDefault();

                this.$(event.currentTarget).blur();
                this.$('.container').focus();
            }
        }

    });

});