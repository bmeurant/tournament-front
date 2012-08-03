define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/participant.html',
    'views/participants/navigation',
    'text!templates/participants/miniature.html',
    'views/participants/details',
    'views/participants/edit',
    'views/participants/add',
    'pubsub'
], function ($, _, Backbone, Participant, participantTemplate, NavigationView, miniatureTemplate, DetailsView, EditView, AddView, Pubsub) {
    var ParticipantView = Backbone.View.extend({

        template:_.template(participantTemplate),
        miniatureTemplate:_.template(miniatureTemplate),

        events:{
        },

        linkedViewsTypes:['details', 'edit'],
        linkedViewsURLFragment:['', '/edit'],
        linkedViewsClasses:[DetailsView, EditView],
        linkedViewsInstances:[],
        renderNext:false,

        handlers:[],

        initialize:function (id, type) {

            this.$el = $("<div>").addClass("row");
            this.el = this.$el.get(0);

            // manually bind this event because Backbone does not trigger events directly bind on el !
            this.$el.on("dragstart", this.dragStartHandler.bind(this));

            this.type = type;
            this.model = new Participant();
            this.model.id = id;

            // create sub navigation component
            this.navigationView = new NavigationView(this.model.id, this.type);

            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM_FROM_BAR, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.onParticipantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_VIEW, this.onParticipantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.CHANGE_VIEW, this.changeParticipantView.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PREVIOUS_CALLED, this.precedentHandler.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.NEXT_CALLED, this.nextHandler.bind(this)));
        },

        render:function () {

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
            else {
                this.showTemplate();
            }

            return this;
        },

        dragStartHandler:function (event) {
            event.originalEvent.dataTransfer.effectAllowed = 'move'; // only dropEffect='copy' will be dropable
            event.originalEvent.dataTransfer.setData('id', this.model.id);
            event.originalEvent.dataTransfer.setData('type', 'participant');


            // create miniature shown during drag
            // this miniature must be already rendered by the browser and not hidden -> should be positioned
            // out of visible page
            // To embed remote image, this should be cacheable and the remote server should implement the
            // corresponding cache politic
            var dragIcon = $("#dragIcon");
            dragIcon.html(this.miniatureTemplate({participant:this.model.toJSON(), server_url:"http://localhost:3000/api"}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 50, 50);

            Pubsub.publish(Events.DRAG_START);
        },

        /**
         * Close the current view and any of its embedded components in order
         * to unbind events and handlers that should not be triggered anymore
         */
        close:function () {


            this.navigationView.close();

            if (this.mainView && (!this.linkedViewsInstances || this.linkedViewsInstances.length == 0 )) {
                this.mainView.close();
            }

            this.closeLinkedViews();

            Backbone.View.prototype.close.apply(this, arguments);
        },

        showTemplate:function () {

            this.$el.html(this.template());
            this.navigationView.render().$el.appendTo(this.$el.find('#navigation'));

            this.renderViews();

            Pubsub.publish(Events.VIEW_CHANGED, [this.type]);
        },

        renderViews:function () {

            this.initializeMainView();

            if (this.mainIsLinkedView()) {
                this.initializeLinkedViews();
                this.renderLinkedViews();
                this.$el.find('#view').addClass('linked-views').css('margin-left', -(this.linkedViewsTypes.indexOf(this.type) * (940 + 20 + 50)) + "px");
            }
            else {
                this.renderMainView();
            }

            setTimeout(function () {
                this.$el.find("form input:not(:disabled)").addClass("test").first().focus();
            }.bind(this), 1);
        },

        mainIsLinkedView:function () {
            return this.linkedViewsTypes.indexOf(this.type) >= 0;
        },

        renderMainView:function () {
            var $mainView = this.mainView.render().$el;
            this.$el.find('#view #edit').html($mainView);
        },

        renderLinkedViews:function () {
            var mainIndex = this.linkedViewsTypes.indexOf(this.type);
            if (this.linkedViewsInstances) {
                for (var i = 0; i < this.linkedViewsInstances.length; i++) {
                    var $newView = this.linkedViewsInstances[i].render().$el;
                    $newView.appendTo(this.$el.find('#view #' + this.linkedViewsInstances[i].type));
                    if (i == mainIndex) {
                        this.$el.find('div#' + this.linkedViewsInstances[i].type).removeClass("hidden");
                    }
                }
            }
        },

        initializeMainView:function () {
            if (this.mainView) {
                this.mainView.close();
            }

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

            this.closeLinkedViews();

            this.linkedViewsInstances = [];
            var indexOfMainView = this.linkedViewsTypes.indexOf(this.type);

            if (indexOfMainView < 0) {
                return;
            }

            this.linkedViewsInstances[indexOfMainView] = this.mainView;

            for (var i = indexOfMainView - 1; i >= 0; i--) {
                this.recordLinkedView(i);
            }

            for (var i = indexOfMainView + 1; i < this.linkedViewsTypes.length; i++) {
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

        recordLinkedView:function (i) {
            var LinkedView = this.linkedViewsClasses[i];
            var linkedViewInstance = new LinkedView(this.model, false);
            if (linkedViewInstance && linkedViewInstance.removeBindings) {
                linkedViewInstance.removeBindings.apply(linkedViewInstance);
            }
            this.linkedViewsInstances[i] = linkedViewInstance;
        },

        deleteFile:function (id, callbackSuccess) {
            var self = this;
            $.ajax({
                url:'http://localhost:3000/api/participant/' + id + '/photo',
                type:'DELETE'
            })
                .done(function (response) {
                    console.log("photo deleted successfully for id");
                    callbackSuccess();
                })
                .fail(function (jqXHR, textStatus, errorMessage) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Error occured while deleting ' + id + 'photo', 'alert-warning']);
                });
        },

        deleteParticipant:function () {
            Pubsub.publish(Events.DELETE_ELEM_FROM_VIEW, [this.model.id, 'participant']);
        },

        onParticipantDeleted:function () {
            Backbone.history.navigate('/participants', true);
        },

        changeParticipantView:function (type) {

            var oldType = this.type;
            this.type = type;
            var mainIndex = this.linkedViewsTypes.indexOf(oldType);

            if (this.linkedViewsInstances[mainIndex].removeBindings) {
                this.linkedViewsInstances[mainIndex].removeBindings();
            }

            var renderNext = this.linkedViewsInstances[mainIndex].renderNext;

            mainIndex = this.linkedViewsTypes.indexOf(this.type);

            if (this.linkedViewsInstances[mainIndex].initBindings) {
                this.linkedViewsInstances[mainIndex].initBindings();
            }

            if (renderNext) {
                this.linkedViewsInstances[mainIndex].render().$el;
                this.renderNext = false;
            }
            this.$el.find('.view-elem#' + this.type).removeClass("hidden");
            this.addTransitionCallbacks(this.$el.find('#view'), this.$el.find('.view-elem#' + oldType));

            Pubsub.publish(Events.VIEW_CHANGED, [this.type]);
            this.$el.find('#view').addClass('slide').css('margin-left', -(mainIndex * (940 + 20 + 50)) + "px");
        },

        addTransitionCallbacks:function ($el, $oldView) {
            $el.on('webkitTransitionEnd', {oldView:$oldView}, this.onTransitionEnd.bind(this));
            $el.on('transitionend', {oldView:$oldView}, this.onTransitionEnd.bind(this));
            $el.on('MSTransitionEnd', {oldView:$oldView}, this.onTransitionEnd.bind(this));
            $el.on('oTransitionEnd', {oldView:$oldView}, this.onTransitionEnd.bind(this));
        },

        onTransitionEnd:function (event) {
            event.data.oldView.addClass("hidden");
            window.history.pushState(null, "Tournament", "/participant/" + this.model.id + this.linkedViewsURLFragment[this.linkedViewsTypes.indexOf(this.type)]);
            this.$el.find("form input:not(:disabled)").first().focus();
            this.$el.find('#view').off('webkitTransitionEnd');
            this.$el.find('#view').off('transitionend');
            this.$el.find('#view').off('MSTransitionEnd');
            this.$el.find('#view').off('oTransitionEnd');
        },

        precedentHandler:function () {
            if (this.mainIsLinkedView()) {
                var mainIndex = this.linkedViewsTypes.indexOf(this.type);

                if (mainIndex > 0) {
                    var newType = this.linkedViewsTypes[mainIndex - 1];
                    this.changeParticipantView(newType);
                }
            }
        },

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