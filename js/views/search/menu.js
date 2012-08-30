define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'hbs!templates/search/menu.html'
], function ($, _, Backbone, Handlebars, searchMenuTemplate) {

    return Backbone.View.extend({

        events:{
            "keydown #searchText":"onKeyDown"
        },

        initialize:function () {
            this.$el = $("<form>").addClass("nav").addClass("navbar-search").addClass("pull-right").addClass("dropdown");
            this.el = this.$el.get(0);
        },

        render:function () {
            this.$el.html(searchMenuTemplate());
            return this;
        },

        onKeyDown:function (event) {
            if (event.which == 27) {
                event.stopPropagation();
                event.preventDefault();

                $(event.currentTarget).blur();
                $('.container').focus();
            }
        }

    });

});