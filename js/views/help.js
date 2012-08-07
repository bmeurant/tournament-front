define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'bootstrap-modal',
    'text!templates/help.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, BootstrapModal, helpTemplate, Pubsub) {

    var HelpView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(helpTemplate),

        events:{
            "keydown": "modalKeydown"
        },

        handlers:[],

        initialize:function () {
            this.$el = $('#help');
            this.handlers.push(Pubsub.subscribe(Events.QUESTION_MARK_CALLED, this.render.bind(this)));
        },

        render:function () {
            this.$el.html(this.template());
            this.$el.modal('show');
            return this;
        },

        modalKeydown:function (event) {
            event.stopPropagation();
            event.preventDefault();
            console.log('echap');
        }

    });
    return HelpView;
});