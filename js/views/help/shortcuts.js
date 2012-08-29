define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'bootstrap',
    'text!templates/help/shortcuts.html',
    'text!templates/help/shortcuts/global.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, BootstrapModal, shortcutsTemplate, globalTemplate, Pubsub) {

    return Backbone.View.extend({

        // Cache the template function for a single item.
        template:Handlebars.compile(shortcutsTemplate),
        globalTemplate:Handlebars.compile(globalTemplate),

        events:{
            "keydown":"modalKeydown"
        },

        initialize:function ($selector) {
            // in this specific case we can add container as el because we will never close or review this view
            this.$el = $selector;
            Pubsub.on(App.Events.KEYBOARD_CALLED, this.render, this);
            Pubsub.on(App.Events.VIEW_CHANGED, this.viewChanged, this);
        },

        render:function () {

            var elemTypeStr = _.str.capitalize(this.elemType);
            var viewTypeStr = _.str.capitalize(this.viewType);

            this.$el.html(this.template({elemType:elemTypeStr, viewType:viewTypeStr}));
            this.$el.find('.global-shortcuts > .shortcuts').html(this.globalTemplate());

            require(['text!templates/help/shortcuts/' + this.elemType + '/' + this.viewType + '.html'],
                function (specificTemplate) {
                    var tpl = Handlebars.compile(specificTemplate);
                    tpl = tpl({elemType:elemTypeStr, viewType:viewTypeStr});
                    if (tpl.indexOf("404") == -1) {
                        this.$el.find('.specific-shortcuts > .shortcuts').html(tpl);
                    }
                }.bind(this));

            this.$el.modal('show');
            return this;
        },

        modalKeydown:function (event) {
            event.stopPropagation();
            event.preventDefault();
        },

        viewChanged:function (elemType, viewType) {
            this.elemType = elemType;
            this.viewType = viewType;
        }

    });
});