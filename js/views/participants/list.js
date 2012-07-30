define([
    'jquery',
    'underscore',
    'backbone',
    'collections/participants',
    'text!templates/participants/list.html',
    'text!templates/participants/miniature.html',
    'pubsub'
], function ($, _, Backbone, participantsCollection, participantListTemplate, participantMiniatureTemplate, Pubsub) {
    var ParticipantListView = Backbone.View.extend({

        template:_.template(participantListTemplate),
        miniatureTemplate:_.template(participantMiniatureTemplate),

        events:{
            "dragstart li.thumbnail[draggable=\"true\"]":"dragStartHandler",
            "dragend li.thumbnail[draggable=\"true\"]":"dragEndHandler"
        },

        handlers:[],

        initialize:function () {
            this.collection = participantsCollection;
            _.bindAll(this, 'render');
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.participantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CANCELED, this.cancelDeletions.bind(this)));
        },

        render:function () {
            var self = this;
            this.collection.fetch(
                {
                    success:function () {
                        self.showTemplate();
                    },
                    error:function () {
                        Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                    }
                });
            return this;
        },

        dragStartHandler:function (event) {
            event.originalEvent.dataTransfer.effectAllowed = 'move'; // only dropEffect='copy' will be dropable
            var id = event.currentTarget.getAttribute('id');
            event.originalEvent.dataTransfer.setData('id', id);
            event.originalEvent.dataTransfer.setData('type', 'participant');

            var participantIndex = $('#'+id).find("input[type='hidden']").get(0).value;
            var participant = this.collection.models[parseInt(participantIndex)];
            var dragIcon = $("#dragIcon");
            dragIcon.html(this.miniatureTemplate({participant:participant.toJSON(), server_url:"http://localhost:3000/api"}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 25, 25);

            Pubsub.publish(Events.DRAG_START);
        },

        dragEndHandler:function (event) {
            Pubsub.publish(Events.DRAG_END);
        },

        showTemplate:function () {
            var deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
            if (!deleted) {
                deleted = [];
            }
            this.$el.html(this.template({participants:this.collection.toJSON(), server_url:'http://localhost:3000/api', deleted:deleted}));
            this.handlers.push(Pubsub.publish(Events.VIEW_CHANGED, ['list']));
        },

        cancelDeletions:function () {
            this.render();
        },

        participantDeleted: function(id) {
            var el = $('#' + id).get(0);
            el.parentNode.removeChild(el);
        }

    });

    return ParticipantListView;
});