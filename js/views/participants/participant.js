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
            "dragstart div[draggable=\"true\"]":"dragStartHandler"
        },

        linkedViewsTypes:['details', 'edit'],
        linkedViewsURLFragment:['', '/edit'],
        linkedViewsClasses:[DetailsView, EditView],
        linkedViewsInstances:[],

        handlers:[],

        initialize:function (id, type) {
            this.type = type;
            this.model = new Participant;
            this.model.id = id;

            this.navigationView = new NavigationView(this.model.id, this.type);

            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.onParticipantDeleted.bind(this)));
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

            var dragIcon = $("#dragIcon");
            dragIcon.html(this.miniatureTemplate({participant:this.model.toJSON(), server_url:"http://localhost:3000/api"}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 50, 50);

            Pubsub.publish(Events.DRAG_START);
        },

        close:function () {
            this.navigationView.close();

            if (this.mainView) {
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
            Pubsub.publish(Events.REMOVE_ALERT);
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
        },

        mainIsLinkedView:function () {
            return this.linkedViewsTypes.indexOf(this.type) >= 0;
        },

        renderMainView:function () {
            var $mainView = this.mainView.render().$el;
            $mainView.appendTo(this.$el.find('#view'));
        },

        renderLinkedViews:function () {
            var mainIndex = this.linkedViewsTypes.indexOf(this.type);
            if (this.linkedViewsInstances) {
                for (var i = 0; i < this.linkedViewsInstances.length; i++) {
                    var $newView = this.linkedViewsInstances[i].render().$el;
                    if (i != mainIndex) {
                        $newView.find('div#' + this.linkedViewsInstances[i].type).addClass("hidden");
                    }
                    $newView.appendTo(this.$el.find('#view'));
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
            this.deletedElements = JSON.parse(localStorage.getItem('deletedElements'));
            this.deletedElements['participant'].push(this.model.id);
            localStorage.setItem('deletedElements', JSON.stringify(this.deletedElements));

            Pubsub.publish(Events.ELEM_DELETED_FROM_VIEW);
            window.location.hash = 'participants';
        },

        onParticipantDeleted:function () {
            window.location.hash = 'participants';
        },

        changeParticipantView:function (type) {

            var oldType = this.type;
            this.type = type;
            var mainIndex = this.linkedViewsTypes.indexOf(oldType);

            if (this.linkedViewsInstances[mainIndex].removeBindings) {
                this.linkedViewsInstances[mainIndex].removeBindings();
            }

            mainIndex = this.linkedViewsTypes.indexOf(this.type);

            if (this.linkedViewsInstances[mainIndex].initBindings) {
                this.linkedViewsInstances[mainIndex].initBindings();
            }

            this.$el.find('.view-elem#' + this.type).removeClass("hidden");
            this.addTransitionCallbacks(this.$el.find('#view'), this.$el.find('.view-elem#' + oldType));

            Pubsub.publish(Events.VIEW_CHANGED, [this.type]);
            this.$el.find('#view').addClass('slide').css('margin-left', -(mainIndex * (940 + 20 + 50)) + "px");
        },

        addTransitionCallbacks:function ($el, $oldView) {
            $el.off('webkitTransitionEnd');
            $el.on('webkitTransitionEnd', {oldView:$oldView}, this.onTransitionEnd);

            $el.off('transitionend');
            $el.on('transitionend', {oldView:$oldView}, this.onTransitionEnd);

            $el.off('MSTransitionEnd');
            $el.on('MSTransitionEnd', {oldView:$oldView}, this.onTransitionEnd);

            $el.off('oTransitionEnd');
            $el.on('oTransitionEnd', {oldView:$oldView}, this.onTransitionEnd);
        },

        onTransitionEnd:function (event) {
            event.data.oldView.addClass("hidden");
        },

        precedentHandler:function () {
            if (this.mainIsLinkedView()) {
                var mainIndex = this.linkedViewsTypes.indexOf(this.type);

                if (mainIndex > 0) {
                    var newType = this.linkedViewsTypes[mainIndex - 1];
                    this.changeParticipantView(newType);

                    window.history.pushState(null, "Tournament", "#participant/" + this.model.id + this.linkedViewsURLFragment[mainIndex - 1 ]);
                }
            }
        },

        nextHandler:function () {
            if (this.mainIsLinkedView()) {
                var mainIndex = this.linkedViewsTypes.indexOf(this.type);

                if (mainIndex < this.linkedViewsTypes.length - 1) {
                    var newType = this.linkedViewsTypes[mainIndex + 1];
                    this.changeParticipantView(newType);

                    window.history.pushState(null, "Tournament", "#participant/" + this.model.id + this.linkedViewsURLFragment[mainIndex + 1]);
                }
            }
        }

    });

    return ParticipantView;
})
;