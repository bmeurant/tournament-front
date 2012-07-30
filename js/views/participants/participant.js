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
            "dragstart div[draggable=\"true\"]":"dragStartHandler",
            "dragend div[draggable=\"true\"]":"dragEndHandler"
        },

        handlers:[],

        initialize:function (id, type) {
            this.type = type;
            this.model = new Participant;
            this.model.id = id;

            this.navigationView = new NavigationView(this.model.id, this.type);

            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.onParticipantDeleted.bind(this)));
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

        dragEndHandler:function (event) {
            Pubsub.publish(Events.DRAG_END);
        },

        close:function () {
            this.navigationView.close();

            if (this.mainView) {
                this.mainView.close();
            }

            Backbone.View.prototype.close.apply(this, arguments);
        },

        showTemplate:function () {

            this.initializeMainView();

            this.$el.html(this.template());
            this.navigationView.render().$el.appendTo(this.$el.find('#navigation'));
            this.mainView.render().$el.appendTo(this.$el.find('#view'));

            Pubsub.publish(Events.VIEW_CHANGED, [this.type]);
        },

        initializeMainView:function () {
            switch (this.type) {
                case 'details':
                    this.mainView = new DetailsView(this.model);
                    break;
                case 'edit':
                    this.mainView = new EditView(this.model);
                    break;
                case 'add':
                    this.mainView = new EditView(this.model);
                    break;
            }
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
        }

    });

    return ParticipantView;
});