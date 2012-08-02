define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/search/menu.html',
    'pubsub'
], function ($, _, Backbone, searchMenuTemplate, Pubsub) {
    var SearchMenuView = Backbone.View.extend({

        menuTemplate:_.template(searchMenuTemplate),

        handlers:[],

        events:{
        },

        initialize:function (el) {
            this.setElement(el);
            this.render();
        },

        render:function () {
            this.$el.html(this.menuTemplate());
        }

    });

    return SearchMenuView;
});