define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/participants/menu.html',
    'pubsub'
], function ($, _, Backbone, menuTemplate, Pubsub) {

    var menuView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:_.template(menuTemplate),

        events:{
            "click .save":"saveElement"
        },

        actions:{
            'list':['add'],
            'details':['list', 'add'],
            'edit':['save', 'list', 'add'],
            'add':['save', 'list', 'add'],
            'no':[]
        },

        //tagName: "ul",

        handlers: [],

        initialize:function () {
            this.handlers.push(Pubsub.subscribe(Events.VIEW_CHANGED, this.onViewChanged.bind(this)));
            this.type = "no";
        },

        onViewChanged: function(type) {
            this.type = type;
            this.render();
        },

        saveElement:function (event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.publish(Events.SAVE_ELEM);
        },

        render:function () {
            this.$el.addClass('nav').html(this.template({actions: this.actions[this.type]}));
            return this;
        }


    });
    return menuView;
});