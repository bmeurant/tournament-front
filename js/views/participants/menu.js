define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/participants/menu.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, menuTemplate, Pubsub) {

    var MenuView = Backbone.View.extend({

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

        handlers:[],

        initialize:function () {

            this.$el = $("<ul>").addClass("nav");
            this.el = this.$el.get(0);

            // default type
            this.type = "";

            this.handlers.push(Pubsub.subscribe(Events.VIEW_CHANGED, this.onViewChanged.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ADD_CALLED, this.addElement.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.LIST_CALLED, this.backToListElement.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ECHAP_CALLED, this.backToElementHome.bind(this)));

            var self = this;

            Handlebars.registerHelper('hidden', function (type) {
                return _.indexOf(self.actions[self.type], type) < 0 ? "hidden" : "";
            });
        },

        /**
         * Handles main view changed by re-rendering this menu
         *
         * @param type main view type
         */
        onViewChanged:function (type) {
            this.type = type;
            this.render();
        },

        /**
         * Propagate save order
         *
         * @param event event raised
         */
        saveElement:function (event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.publish(Events.SAVE_ELEM);
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
    return MenuView;
});