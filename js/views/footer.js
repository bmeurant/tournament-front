define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/footer.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, footerTemplate, Pubsub) {

    var FooterView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(footerTemplate),

        events:{
            "click p.shortcuts-menu a":"showShortcuts"
        },

        handlers:[],

        initialize:function () {
        },

        render:function () {
            this.$el.html(this.template());
            return this;
        },

        showShortcuts:function (event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.publish(Events.KEYBOARD_CALLED);
        }

    });
    return FooterView;
});