define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/search/menu.html'
], function ($, _, Backbone, searchMenuTemplate) {
    var SearchMenuView = Backbone.View.extend({

        menuTemplate:_.template(searchMenuTemplate),

        handlers:[],

        events:{
        },

        initialize:function () {
            this.$el = $("<form>").addClass("nav").addClass("navbar-search").addClass("pull-right").addClass("dropdown");
            this.el = this.$el.get(0);
        },

        render:function () {
            this.$el.html(this.menuTemplate());
            return this;
        }

    });

    return SearchMenuView;
});