define([
    'jquery',
    'backbone',
    'hbs!templates/search/menu.html'
], function($, Backbone, searchMenuTemplate) {

    return Backbone.View.extend({

        tagName: 'form',
        attributes: {
            class: 'nav navbar-search pull-right dropdown'
        },

        events: {
            'keydown #searchText': 'onKeyDown'
        },

        render: function() {
            this.$el.html(searchMenuTemplate());
            return this;
        },

        onKeyDown: function(event) {
            if (event.which == 27) {
                event.stopPropagation();
                event.preventDefault();

                $(event.currentTarget).blur();
                $('.container').focus();
            }
        }

    });

});