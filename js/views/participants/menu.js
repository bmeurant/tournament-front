define([
    'underscore',
    'backbone',
    'resthub-handlebars',
    'hbs!templates/participants/menu.html',
    'pubsub'
], function(_, Backbone, Handlebars, menuTemplate, Pubsub) {

    return Backbone.View.extend({

        elemType: 'participant',

        template: menuTemplate,

        events: {
            'click .save': 'saveElement'
        },

        tagName: 'ul',
        attributes: {
            class: 'nav'
        },

        // displayable actions on menu depending of the current view type
        actions: {
            list: ['add'],
            details: ['list', 'add'],
            edit: ['save', 'list', 'add'],
            add: ['save', 'list'],
            no: []
        },

        initialize: function() {

            // default type
            this.viewType = '';

            Pubsub.on(App.Events.VIEW_CHANGED, this.onViewChanged, this);
            Pubsub.on(App.Events.ADD_CALLED, this.addElement, this);
            Pubsub.on(App.Events.LIST_CALLED, this.backToListElement, this);
            Pubsub.on(App.Events.ECHAP_CALLED, this.backToElementHome, this);

            Handlebars.registerHelper('hidden', function(viewType) {
                return _.indexOf(this.actions[this.viewType], viewType) < 0 ? 'hidden' : '';
            }.bind(this));

            this.render();
        },

        /**
         * Handles main view changed by re-rendering this menu
         *
         * @param elemType type of the element managed by the main view
         * @param viewType main view type
         */
        onViewChanged: function(elemType, viewType) {
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
        saveElement: function(event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.trigger(App.Events.SAVE_ELEM);
        },

        backToElementHome: function() {
            Backbone.history.navigate('/participants', true);
        },

        backToListElement: function() {
            Backbone.history.navigate('/participants', true);
        },

        addElement: function() {
            Backbone.history.navigate('/participant/add', true);
        }

    });
});