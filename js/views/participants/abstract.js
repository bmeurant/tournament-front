define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/miniature.html',
    'text!templates/participants/abstract.html',
    'views/participants/navigation',
    'text!templates/participants/navigation.html',
    'pubsub'
], function ($, _, Backbone, Participant, miniatureTemplate, abstractTemplate, ParticipantNavigationView, participantNavigationTemplate, Pubsub) {

    var AbstractView = Backbone.View.extend({

        miniatureTemplate:_.template(miniatureTemplate),
        abstractTemplate:_.template(abstractTemplate),
        navigationTemplate:_.template(participantNavigationTemplate),


        events:{
            "dragstart div[draggable=\"true\"]":"dragStartHandler",
            "dragend div[draggable=\"true\"]":"dragEndHandler",
            "click .nav-pills":"navClicked"
        },

        handlers:[],

        initialize:function (id) {
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.onParticipantDeleted.bind(this)));

            this.model = new Participant;
            this.model.id = id;
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

        navClicked:function () {
            Pubsub.publish(Events.REMOVE_ALERT);
        },

        render:function () {
            this.model.fetch({
                success:function () {
                    this.showTemplate();
                }.bind(this),
                error:function () {
                    Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to get participant', 'alert-error']);
                }
            });
            return this;
        },

        showTemplate:function () {
            this.$el.html(this.abstractTemplate({participant:this.model.toJSON(), server_url:'http://localhost:3000/api', 'view_template':this.template, 'navigation_template':this.navigationTemplate, type: this.type}));
            Pubsub.publish(Events.VIEW_CHANGED, [this.type]);
        }
    });

    return AbstractView;
});