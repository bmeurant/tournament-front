define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'text!templates/participants/menu.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, menuTemplate, Pubsub) {

    return Backbone.View.extend({

        elemType:'participant',

        // Cache the template function for a single item.
        template:Handlebars.compile(menuTemplate),

        events:{
            "click .save":"saveElement"
        },

        // displayable actions on menu depending of the current view type
        actions:{
            'list':['add'],
            'details':['list', 'add'],
            'edit':['save', 'list', 'add'],
            'add':['save', 'list'],
            'no':[]
        },

        initialize:function () {

            this.$el = $("<ul>").addClass("nav");
            this.el = this.$el.get(0);

            // default type
            this.viewType = "";

            Pubsub.on(App.Events.VIEW_CHANGED, this.onViewChanged.bind(this), this);
            Pubsub.on(App.Events.ADD_CALLED, this.addElement.bind(this), this);
            Pubsub.on(App.Events.LIST_CALLED, this.backToListElement.bind(this), this);
            Pubsub.on(App.Events.ECHAP_CALLED, this.backToElementHome.bind(this), this);

            Handlebars.registerHelper('hidden', function (viewType) {
                return _.indexOf(this.actions[this.viewType], viewType) < 0 ? "hidden" : "";
            }.bind(this));
        },

        /**
         * Handles main view changed by re-rendering this menu
         *
         * @param elemType type of the element managed by the main view
         * @param viewType main view type
         */
        onViewChanged:function (elemType, viewType) {
            if (elemType == this.elemType) {
                this.viewType = viewType;
                this.render();
            }
        },

        /**
         * Propagate save order
         *
         * @param event event raised
         */
        saveElement:function (event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.trigger(App.Events.SAVE_ELEM);
        },

        render:function () {
            this.$el.html(this.template());
            return this;
        },

        backToElementHome:function () {
            Backbone.history.navigate("/participants", true);
        },

        backToListElement:function () {
            Backbone.history.navigate("/participants", true);
        },

        addElement:function () {
            Backbone.history.navigate("/participant/add", true);
        }

    });
});