define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'models/participant',
    'text!templates/participants/participant.html',
    'views/participants/navigation',
    'text!templates/participants/miniature.html',
    'views/participants/details',
    'views/participants/edit',
    'views/participants/add',
    'pubsub'
], function ($, _, Backbone, Handlebars, Participant, participantTemplate, NavigationView, miniatureTemplate, DetailsView, EditView, AddView, Pubsub) {

    /**
     * Manage global view surrounding all unitary participants views
     */
    var ParticipantView = Backbone.View.extend({

        template:Handlebars.compile(participantTemplate),
        miniatureTemplate:Handlebars.compile(miniatureTemplate),

        events:{
        },

        // management of linked views : i.e. views that could be switched with transition and without a
        // global re-redering
        linkedViewsTypes:['details', 'edit'],
        linkedViewsURLFragment:['', '/edit'],
        linkedViewsClasses:[DetailsView, EditView],
        linkedViewsInstances:[],

        // determines if the next view has to be re-rendered before switch
        renderNext:false,

        handlers:[],

        /**
         * Initialize view
         *
         * @param id id of the participant
         * @param type type of the main view
         */
        initialize:function (id, type) {

            this.$el = $("<div>").addClass("row");
            this.el = this.$el.get(0);

            // manually bind this event because Backbone does not trigger events directly bind on el !
            this.$el.on("dragstart", this.dragStartHandler.bind(this));

            this.type = type;
            this.model = new Participant();
            this.model.id = id;

            // get the list of current deleted elements from local storage in order to exclude these
            // elements from rendered view
            this.deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
            if (!this.deleted) {
                this.deleted = [];
            }

            // create sub navigation component
            this.navigationView = new NavigationView(this.model.id, this.type);

            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM_FROM_BAR, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.onParticipantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_VIEW, this.onParticipantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.CHANGE_VIEW, this.changeParticipantView.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PREVIOUS_CALLED, this.precedentHandler.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.NEXT_CALLED, this.nextHandler.bind(this)));
        },

        render:function () {

            if (this.model.id && this.deleted.indexOf(this.model.id) >= 0) {
                Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'This participant is currently being deleted', 'alert-error']);

                setTimeout(function () {
                    Backbone.history.navigate("/participants", true);
                }.bind(this), 100);

                return this;
            }

            // retrieve model from server and render view
            if (this.model.id) {
                this.model.fetch({
                    success:function () {
                        this.showTemplate();
                    }.bind(this),
                    error:function () {
                        Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to get participant', 'alert-error']);
                    }
                });
            }
            // no model id : no model to retrieve (probably an 'add' view)
            else {
                this.showTemplate();
            }

            return this;
        },

        /**
         * Handles drag start on current view
         *
         * @param event event raised
         */
        dragStartHandler:function (event) {

            // set transfer data
            event.originalEvent.dataTransfer.effectAllowed = 'move'; // only dropEffect='copy' will be dropable
            event.originalEvent.dataTransfer.setData('id', this.model.id);
            event.originalEvent.dataTransfer.setData('type', 'participant');

            // create miniature shown during drag
            // this miniature must be already rendered by the browser and not hidden -> should be positioned
            // out of visible page
            // To embed remote image, this should be cacheable and the remote server should implement the
            // corresponding cache politic
            var dragIcon = $("#dragIcon");
            dragIcon.html(this.miniatureTemplate({participant:this.model.toJSON()}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 50, 50);

            Pubsub.publish(Events.DRAG_START);
        },

        /**
         * Close the current view and any of its embedded components in order
         * to unbind events and handlers that should not be triggered anymore
         */
        close:function () {

            this.navigationView.close();

            // if no linkedViews
            if (this.mainView && (!this.linkedViewsInstances || this.linkedViewsInstances.length == 0 )) {
                this.mainView.close();
            }

            this.closeLinkedViews();

            Backbone.View.prototype.close.apply(this, arguments);
        },

        /**
         * Render all views
         */
        showTemplate:function () {

            this.$el.html(this.template());
            this.navigationView.render().$el.appendTo(this.$el.find('#navigation'));

            this.renderViews();

            Pubsub.publish(Events.VIEW_CHANGED, [this.type]);
        },

        /**
         * Render main and linked views
         */
        renderViews:function () {

            this.initializeMainView();

            // if it exists linked views, render these views
            if (this.mainIsLinkedView()) {
                this.initializeLinkedViews();
                this.renderLinkedViews();
                // allow css transitions between linked views
                this.$el.find('#view').addClass('linked-views').css('margin-left', -(this.linkedViewsTypes.indexOf(this.type) * (940 + 20 + 50)) + "px");
            }
            else {
                this.renderMainView();
            }

            // give focus after a mini timeout because some browsers (FFX) need it to give focus
            setTimeout(function () {
                this.$el.find("form input:not(:disabled)").first().focus();
            }.bind(this), 1);
        },

        /**
         * @return {Boolean} true if current main view is linked to others views
         */
        mainIsLinkedView:function () {
            return this.linkedViewsTypes.indexOf(this.type) >= 0;
        },

        renderMainView:function () {
            var $mainView = this.mainView.render().$el;
            this.$el.find('#view #edit').html($mainView).removeClass("hidden");
        },

        renderLinkedViews:function () {
            // get index of current main view
            var mainIndex = this.linkedViewsTypes.indexOf(this.type);

            // retrieves successively linked instances and render each one
            if (this.linkedViewsInstances) {
                for (var i = 0; i < this.linkedViewsInstances.length; i++) {
                    var $newView = this.linkedViewsInstances[i].render().$el;
                    $newView.appendTo(this.$el.find('#view #' + this.linkedViewsInstances[i].type));

                    // it its main view, show it. Otherwise it keeped hidden
                    if (i == mainIndex) {
                        this.$el.find('div#' + this.linkedViewsInstances[i].type).removeClass("hidden");
                    }
                }
            }
        },

        initializeMainView:function () {

            // it a previous main view exists, close (and unbind) it
            if (this.mainView) {
                this.mainView.close();
            }

            // instanciate it depending on its type
            switch (this.type) {
                case 'details':
                    this.mainView = new DetailsView(this.model);
                    break;
                case 'edit':
                    this.mainView = new EditView(this.model);
                    break;
                case 'add':
                    this.mainView = new AddView(this.model);
                    break;
            }

        },

        initializeLinkedViews:function () {

            // close any other existing view
            this.closeLinkedViews();

            // initialize instances container and add main view instance on its index
            this.linkedViewsInstances = [];
            var indexOfMainView = this.linkedViewsTypes.indexOf(this.type);

            if (indexOfMainView < 0) {
                return;
            }

            this.linkedViewsInstances[indexOfMainView] = this.mainView;

            // record previous linked views
            var i;
            for (i = indexOfMainView - 1; i >= 0; i--) {
                this.recordLinkedView(i);
            }

            // record next linked views
            for (i = indexOfMainView + 1; i < this.linkedViewsTypes.length; i++) {
                this.recordLinkedView(i);
            }

        },

        closeLinkedViews:function () {
            if (this.linkedViewsInstances) {
                $.each(this.linkedViewsInstances, function (index, value) {
                    value.close();
                });
            }
        },

        /**
         * Record a new instance of a linked view
         *
         * @param i index of the view to record
         */
        recordLinkedView:function (i) {

            // get the corresponding class and instantiate it, keeping it deactivated (argument 'false')
            var LinkedView = this.linkedViewsClasses[i];
            var linkedViewInstance = new LinkedView(this.model, false);

            // for safety, explicitly remove bindings
            if (linkedViewInstance && linkedViewInstance.removeBindings) {
                linkedViewInstance.removeBindings.apply(linkedViewInstance);
            }

            // add the view to global conatiner
            this.linkedViewsInstances[i] = linkedViewInstance;
        },

        /**
         * Handles deletion of current participant photo file
         *
         * @param id id of the participant to delete
         * @param callbackSuccess callback to call if deletion is successful
         */
        deleteFile:function (id, callbackSuccess) {
            $.ajax({
                url:'http://localhost:3000/api/participant/' + id + '/photo',
                type:'DELETE'
            })
                .done(function () {
                    console.log("photo deleted successfully for id");
                    callbackSuccess();
                })
                .fail(function () {
                    Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Error occurred while deleting ' + id + 'photo', 'alert-warning']);
                });
        },

        /**
         * Asks for current participant deletion
         */
        deleteParticipant:function () {
            Pubsub.publish(Events.DELETE_ELEM_FROM_VIEW, ['participant', this.model.id]);
        },

        /**
         * Handles effective current participant deletion
         */
        onParticipantDeleted:function () {
            Backbone.history.navigate('/participants', true);
        },

        /**
         * Handles a main view change
         *
         * @param type main view type to render
         */
        changeParticipantView:function (type) {

            var oldType = this.type;
            this.type = type;
            var mainIndex = this.linkedViewsTypes.indexOf(oldType);

            // unbind current main view
            if (this.linkedViewsInstances[mainIndex].removeBindings) {
                this.linkedViewsInstances[mainIndex].removeBindings();
            }

            // is old view model was updated
            var updated = this.linkedViewsInstances[mainIndex].updated;

            // retrieve and bind new main view
            mainIndex = this.linkedViewsTypes.indexOf(this.type);
            if (this.linkedViewsInstances[mainIndex].initBindings) {
                this.linkedViewsInstances[mainIndex].initBindings();
            }

            // re-render next view if previous model was updated
            if (updated) {
                this.linkedViewsInstances[mainIndex].render();
                this.renderNext = false;
            }

            // display new view
            this.$el.find('.view-elem#' + this.type).removeClass("hidden");

            // hide navigation bar during transition because of some potential bugs
            this.$el.find('#navigation .nav-pills').addClass("hidden");

            // register callbacks executed after css transition
            this.addTransitionCallbacks(this.$el.find('#view'), this.$el.find('.view-elem#' + oldType));

            Pubsub.publish(Events.VIEW_CHANGED, [this.type]);

            // perform transition
            this.$el.find('#view').addClass('slide').css('margin-left', -(mainIndex * (940 + 20 + 50)) + "px");
        },

        /**
         * Register callbacks for css transition
         *
         * @param $el jquery element on which register event
         * @param $oldView jquery element of the old view
         */
        addTransitionCallbacks:function ($el, $oldView) {
            $el.on('webkitTransitionEnd', {oldView:$oldView}, this.onTransitionEnd.bind(this));
            $el.on('transitionend', {oldView:$oldView}, this.onTransitionEnd.bind(this));
            $el.on('MSTransitionEnd', {oldView:$oldView}, this.onTransitionEnd.bind(this));
            $el.on('oTransitionEnd', {oldView:$oldView}, this.onTransitionEnd.bind(this));
        },

        /**
         * Method called after css transition done
         *
         * @param event raised event
         */
        onTransitionEnd:function (event) {

            // hide old view
            event.data.oldView.addClass("hidden");
            this.$el.find('#navigation .nav-pills').removeClass("hidden");

            // change url
            window.history.pushState(null, "Tournament", "/participant/" + this.model.id + this.linkedViewsURLFragment[this.linkedViewsTypes.indexOf(this.type)]);

            // give focus to first input if exists
            this.$el.find("form input:not(:disabled)").first().focus();

            // unbind events
            this.$el.find('#view').off('webkitTransitionEnd');
            this.$el.find('#view').off('transitionend');
            this.$el.find('#view').off('MSTransitionEnd');
            this.$el.find('#view').off('oTransitionEnd');
        },

        /**
         *  Show the precedent linked view
         */
        precedentHandler:function () {
            if (this.mainIsLinkedView()) {
                var mainIndex = this.linkedViewsTypes.indexOf(this.type);

                if (mainIndex > 0) {
                    var newType = this.linkedViewsTypes[mainIndex - 1];
                    this.changeParticipantView(newType);
                }
            }
        },

        /**
         *  Show the next linked view
         */
        nextHandler:function () {
            if (this.mainIsLinkedView()) {
                var mainIndex = this.linkedViewsTypes.indexOf(this.type);

                if (mainIndex < this.linkedViewsTypes.length - 1) {
                    var newType = this.linkedViewsTypes[mainIndex + 1];
                    this.changeParticipantView(newType);
                }
            }
        }

    });

    return ParticipantView;
})
;