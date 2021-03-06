define([
    'underscore',
    'backbone',
    'models/participant',
    'hbs!templates/participants/participant.html',
    'views/participants/navigation',
    'hbs!templates/participants/miniature.html',
    'views/participants/details',
    'views/participants/edit',
    'views/participants/add',
    'pubsub',
    'i18n!nls/messages'
], function(_, Backbone, Participant, participantTemplate, NavigationView, miniatureTemplate, DetailsView, EditView, AddView, Pubsub, messages) {

    /**
     * Manage global view surrounding all unitary participants views
     */
    return Backbone.View.extend({

        elemType: 'participant',
        template: participantTemplate,

        events: {
            dragend: 'dragEndHandler'
        },

        attributes: {
            class: 'row'
        },

        linkedViewsOrder: ["details", "edit"],
        linkedViews: {
            details: {
                url: '',
                instance: null
            },
            edit: {
                url: '/edit',
                instance: null
            }
        },

        /**
         * Initialize view
         *
         * @param id id of the participant
         * @param viewType main view type
         */
        initialize: function() {
            // manually bind this event because Backbone does not trigger events directly bound on el !
            this.$el.on('dragstart', this.dragStartHandler.bind(this));

            this.viewType = this.options.type;
            this.model = new Participant();
            this.model.id = this.options.id;

            this.inTransition = false;

            this.initDeleted();
            this.initViews();

            Pubsub.on(App.Events.DELETE_ELEM, this.deleteParticipant, this);
            Pubsub.on(App.Events.DELETE_ELEM_FROM_BAR, this.deleteParticipant, this);
            Pubsub.on(App.Events.ELEM_DELETED_FROM_BAR, this.onParticipantDeleted, this);
            Pubsub.on(App.Events.ELEM_DELETED_FROM_VIEW, this.onParticipantDeleted, this);
            Pubsub.on(App.Events.CHANGE_VIEW, this.changeParticipantView, this);
            Pubsub.on(App.Events.PREVIOUS_CALLED, this.precedentHandler, this);
            Pubsub.on(App.Events.NEXT_CALLED, this.nextHandler, this);

            if (this.model.id && this.deleted.indexOf(this.model.id) >= 0) {
                Pubsub.trigger(App.Events.ALERT_RAISED, messages.error, messages.errorParticipantBeingDeleted, 'alert-error');

                setTimeout(function() {
                    Backbone.history.navigate('/participants', true);
                }.bind(this), 100);

                return this;
            }

            // retrieve model from server and render view
            if (this.model.id) {
                this.model.fetch({
                    success: this.renderViews.bind(this),
                    error: function() {
                        Pubsub.trigger(App.Events.ALERT_RAISED, messages.error, messages.errorFetchParticipant, 'alert-error');
                    }
                });
            }
            // no model id : no model to retrieve (probably an 'add' view)
            else {
                this.renderViews();
            }
        },

        initDeleted: function() {
            // get the list of current deleted elements from local storage in order to exclude these
            // elements from rendered view
            this.deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
            if (!this.deleted) {
                this.deleted = [];
            }
        },

        initViews: function() {
            this.render();

            // create sub navigation component
            this.navigationView = new NavigationView({root: this.$('#navigation'), model: this.model, type: this.viewType});

            this.initLinkedViews();
            this.initMainView();
        },

        initLinkedViews: function() {
            this.linkedViews.details.instance = new DetailsView({root: this.$('#view #details'), model: this.model, active: false});
            this.linkedViews.edit.instance = new EditView({root: this.$('#view #edit'), model: this.model, active: false});
        },

        initMainView: function() {
            this.mainView = this.linkedViews[this.viewType].instance;

            if (this.mainView.initBindings) {
                this.mainView.initBindings();
            }

            Pubsub.trigger(App.Events.VIEW_CHANGED, this.elemType, this.viewType);
        },

        /**
         * Render main and linked views
         */
        renderViews: function() {
            this.$('#view #' + this.viewType).removeClass('hidden');

            // allow css transitions between linked views
            this.$('#view').addClass('linked-views').css('margin-left', -(this.linkedViewsOrder.indexOf(this.viewType) * (940 + 20 + 50)) + 'px');

            // give focus after a mini timeout because some browsers (FFX) need it to give focus
            setTimeout(function() {
                this.$('form input:not(:disabled)').first().focus();
            }.bind(this), 1);
        },

        /**
         * Handles deletion of current participant photo file
         *
         * @param id id of the participant to delete
         * @param callbackSuccess callback to call if deletion is successful
         */
        deleteFile: function(id, callbackSuccess) {
            $.ajax({
                url: App.Config.serverRootURL + '/participant/' + id + '/photo',
                type: 'DELETE'
            })
                .done(function() {
                    console.log('photo deleted successfully for id');
                    callbackSuccess();
                })
                .fail(function() {
                    Pubsub.trigger(App.Events.ALERT_RAISED, messages.warning, _.str.sprintf(messages.errorDeletingPhoto, id), 'alert-warning');
                });
        },

        /**
         * Asks for current participant deletion
         */
        deleteParticipant: function() {
            this.navigationView.hideTooltips();
            Pubsub.trigger(App.Events.DELETE_ELEM_FROM_VIEW, 'participant', this.model.id);
        },

        /**
         * Handles effective current participant deletion
         */
        onParticipantDeleted: function() {
            Backbone.history.navigate('/participants', true);
        },

        /**
         * Handles a main view change
         *
         * @param viewType main view type to render
         */
        changeParticipantView: function(viewType) {
            if (this.mainView.removeBindings) {
                this.mainView.removeBindings();
            }

            var oldType = this.viewType;
            this.viewType = viewType;

            this.mainView = this.linkedViews[viewType].instance;

            // display new view
            this.$('.view-elem#' + this.viewType).removeClass('hidden');

            // hide navigation bar and deactivate controls during transition because of some potential bugs
            this.$('#navigation .nav-pills').addClass('hidden');
            this.inTransition = true;

            // register callbacks executed after css transition
            this.addTransitionCallbacks(this.$('#view'), this.$('.view-elem#' + oldType));

            Pubsub.trigger(App.Events.VIEW_CHANGED, this.elemType, this.viewType);

            // perform transition
            this.$('#view').addClass('slide').css('margin-left', -(this.linkedViewsOrder.indexOf(this.viewType) * (940 + 20 + 50)) + 'px');
        },

        /**
         * Register callbacks for css transition
         *
         * @param $el jquery element on which register event
         * @param $oldView jquery element of the old view
         */
        addTransitionCallbacks: function($el, $oldView) {
            $el.on('webkitTransitionEnd', {oldView: $oldView}, this.onTransitionEnd.bind(this));
            $el.on('transitionend', {oldView: $oldView}, this.onTransitionEnd.bind(this));
            $el.on('MSTransitionEnd', {oldView: $oldView}, this.onTransitionEnd.bind(this));
            $el.on('oTransitionEnd', {oldView: $oldView}, this.onTransitionEnd.bind(this));
        },

        /**
         * Method called after css transition done
         *
         * @param event raised event
         */
        onTransitionEnd: function(event) {
            // hide old view
            event.data.oldView.addClass('hidden');

            // reactivate nav bar and controls
            this.$('#navigation .nav-pills').removeClass('hidden');
            this.inTransition = false;

            // change url
            Backbone.history.navigate('participant/' + this.model.id + this.linkedViews[this.viewType].url, false);

            // give focus to first input if exists
            this.$('form input:not(:disabled)').first().focus();

            // unbind events
            this.$('#view').off('webkitTransitionEnd');
            this.$('#view').off('transitionend');
            this.$('#view').off('MSTransitionEnd');
            this.$('#view').off('oTransitionEnd');
        },

        /**
         *  Show the precedent linked view
         */
        precedentHandler: function() {
            if (!this.inTransition) {
                var currentIndex = this.linkedViewsOrder.indexOf(this.viewType);

                if (currentIndex > 0) {
                    var newType = this.linkedViewsOrder[currentIndex - 1];
                    this.changeParticipantView(newType);
                }
            }
        },

        /**
         *  Show the next linked view
         */
        nextHandler: function() {
            if (!this.inTransition) {
                var currentIndex = this.linkedViewsOrder.indexOf(this.viewType);

                if (currentIndex < this.linkedViewsOrder.length - 1) {
                    var newType = this.linkedViewsOrder[currentIndex + 1];
                    this.changeParticipantView(newType);
                }
            }
        },

        /**
         * Handles drag start on current view
         *
         * @param event event raised
         */
        dragStartHandler: function(event) {
            this.navigationView.hideTooltips();

            // set transfer data
            event.originalEvent.dataTransfer.effectAllowed = 'move'; // only dropEffect='copy' will be droppable
            event.originalEvent.dataTransfer.setData('id', this.model.id);
            event.originalEvent.dataTransfer.setData('elemType', 'participant');

            // create miniature shown during drag
            // this miniature must be already rendered by the browser and not hidden -> should be positioned
            // out of visible page
            // To embed remote image, this should be cacheable and the remote server should implement the
            // corresponding cache politic
            var dragIcon = $('#dragIcon');
            dragIcon.html(miniatureTemplate({participant: this.model.toJSON()}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 50, 50);

            Pubsub.trigger(App.Events.DRAG_START);
        },

        dragEndHandler: function() {
            Pubsub.trigger(App.Events.DRAG_END);
        }
    });
});