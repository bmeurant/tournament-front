define([
    'jquery',
    'backbone',
    'pubsub',
    'keymaster'
], function($, Backbone, Pubsub) {

    /**
     * Global controller allowing to map and publish keyboard events and controls
     */
    return Backbone.View.extend({

        events: {
        },

        initialize: function() {

            this.setElement(document);

            this.originalFilter = key.filter;
            key.filter = this.filter.bind(this);

            key('left', function(event) {
                this.pushEvent(App.Events.PREVIOUS_CALLED, event)
            }.bind(this));
            key('right', function(event) {
                this.pushEvent(App.Events.NEXT_CALLED, event)
            }.bind(this));
            key('h', function(event) {
                this.pushEvent(App.Events.HOME_CALLED, event)
            }.bind(this));
            key('l', function(event) {
                this.pushEvent(App.Events.LIST_CALLED, event)
            }.bind(this));
            key('del', function(event) {
                this.pushEvent(App.Events.DELETE_ELEM, event)
            }.bind(this));
            key('d', function(event) {
                this.pushEvent(App.Events.DELETIONS_CALLED, event)
            }.bind(this));
            key('a', function(event) {
                this.pushEvent(App.Events.ADD_CALLED, event)
            }.bind(this));
            key('ctrl+x', function(event) {
                this.pushEvent(App.Events.CONFIRM_DELS_CALLED, event)
            }.bind(this));
            key('ctrl+z', function(event) {
                this.pushEvent(App.Events.CANCEL_DELS_CALLED, event)
            }.bind(this));
            key('p', function(event) {
                this.pushEvent(App.Events.PARTICIPANTS_HOME_CALLED, event)
            }.bind(this));
            key('t', function(event) {
                this.pushEvent(App.Events.TEAMS_HOME_CALLED, event)
            }.bind(this));
            key('g', function(event) {
                this.pushEvent(App.Events.GT_HOME_CALLED, event)
            }.bind(this));
            key('f', function(event) {
                this.pushEvent(App.Events.FIND_CALLED, event)
            }.bind(this));
            key('enter', function(event) {
                this.pushEvent(App.Events.ENTER_CALLED, event)
            }.bind(this));
            key('esc', function(event) {
                this.pushEvent(App.Events.ECHAP_CALLED, event)
            }.bind(this));
            key('pageup', function(event) {
                this.pushEvent(App.Events.PAGE_UP_CALLED, event)
            }.bind(this));
            key('pagedown', function(event) {
                this.pushEvent(App.Events.PAGE_DOWN_CALLED, event)
            }.bind(this));
            key('?', function(event) {
                this.pushEvent(App.Events.HELP_CALLED, event)
            }.bind(this));
            key('k', function(event) {
                this.pushEvent(App.Events.KEYBOARD_CALLED, event)
            }.bind(this));

        },

        pushEvent: function(appEvent, event) {
            Pubsub.trigger(appEvent, event);
        },

        isModalActive: function() {
            return $('.modal').is(':visible');
        },

        filter: function(event) {
            if (!(event.which == 27) && this.isModalActive()) return false;

            return this.originalFilter.apply(this, [event]);
        }

    });

});
