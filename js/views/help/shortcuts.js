define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'bootstrap-modal',
    'text!templates/help/shortcuts.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, BootstrapModal, shortcutsTemplate, Pubsub) {

    var HelpView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(shortcutsTemplate),

        events:{
            "keydown": "modalKeydown"
        },

        handlers:[],

        initialize:function () {
            this.$el = $('#shortcuts');
            this.handlers.push(Pubsub.subscribe(Events.KEYBOARD_CALLED, this.render.bind(this)));
        },

        render:function () {
            this.$el.html(this.template());
            this.$el.modal('show');
            return this;
        },

        modalKeydown:function (event) {
            event.stopPropagation();
            event.preventDefault();
        }

    });
    return HelpView;
});