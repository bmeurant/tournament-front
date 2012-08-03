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
            "focusin ul.thumbnails li.thumbnail a":"elemFocused",
            "focusout ul.thumbnails li.thumbnail a":"elemLooseFocus"
        },

        handlers:[],

        initialize:function () {
            this.$el = $("<ul>").addClass("thumbnails").addClass("span12");
            this.el = this.$el.get(0);

            this.collection = participantsCollection;

            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.participantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CANCELED, this.cancelDeletions.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.NEXT_CALLED, this.selectNext.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PREVIOUS_CALLED, this.selectPrevious.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM_FROM_BAR, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ENTER_CALLED, this.showSelected.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_VIEW, this.participantDeleted.bind(this)));
        },

        render:function (idSelected) {
            this.collection.fetch(
                {
                    success:function () {
                        this.showTemplate(idSelected);
                    }.bind(this),
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

            var participantIndex = $('#' + id).find("input[type='hidden']").get(0).value;
            var participant = this.collection.models[parseInt(participantIndex)];
            var dragIcon = $("#dragIcon");
            dragIcon.html(this.miniatureTemplate({participant:participant.toJSON(), server_url:"http://localhost:3000/api"}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 25, 25);

            Pubsub.publish(Events.DRAG_START);
        },

        showTemplate:function (idSelected) {
            var deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
            if (!deleted) {
                deleted = [];
            }

            this.$el.html(this.template({participants:this.collection.toJSON(), server_url:'http://localhost:3000/api', deleted:deleted, 'id_selected':idSelected}));
            this.selectElement();

            this.handlers.push(Pubsub.publish(Events.VIEW_CHANGED, ['list']));
        },

        cancelDeletions:function () {
            var $selected = this.findSelected();
            var idSelected;

            if ($selected && $selected.length > 0) {
                idSelected = this.findSelected().get(0).id;
            }
            this.render(idSelected);
        },

        participantDeleted:function (id) {
            var $element = $('#' + id);

            if ($element.hasClass("selected")) {
                this.selectPrevious();
            }

            $element.remove();

            var $selected = this.findSelected();
            if (!$selected || $selected.length == 0) {
                this.selectFirst();
            }

        },

        selectElement:function (type) {
            var $selected = this.findSelected();
            if (!$selected || $selected.length == 0) {
                this.selectFirst();
                return;
            }

            var $toSelect = (type == 'previous') ? this.findPreviousSelect() : this.findNextSelect();

            if ($toSelect && $toSelect.length > 0) {
                $toSelect.addClass("selected");
                $selected.removeClass("selected");
                $('*:focus').blur();
                $toSelect.focus();
            }

        },

        selectNext:function () {
            this.selectElement("next");
        },

        selectPrevious:function () {
            this.selectElement("previous");
        },

        selectFirst:function () {
            var $toselect = this.$el.find("li.thumbnail:first-child");
            if ($toselect && $toselect.length != 0) {
                $('*:focus').blur();
                $toselect.addClass("selected").focus();
            }
        },

        findSelected:function () {
            return this.$el.find("li.thumbnail.selected");
        },

        findNextSelect:function () {
            return this.$el.find("li.thumbnail.selected + li.thumbnail");
        },

        findPreviousSelect:function () {
            var previous = this.$el.find("li.thumbnail.selected").get(0).previousElementSibling;
            if (previous) {
                return this.$el.find('#' + previous.id);
            }
            return null;
        },

        deleteParticipant:function () {

            var $selected = this.findSelected();
            if ($selected && $selected.length > 0) {
                this.participantDeleted($selected.get(0).id);

                Pubsub.publish(Events.DELETE_ELEM_FROM_VIEW, [$selected.get(0).id, 'participant']);
            }
        },

        showSelected:function () {
            var $selected = this.findSelected();
            if ($selected && $selected.length > 0) {
                Backbone.history.navigate('/participant/' + $selected.get(0).id, true);
            }
        },

        elemFocused:function (event) {
            if (event && event.currentTarget) {
                $selected = this.findSelected();
                if ($selected && $selected.length != 0) {
                    $selected.removeClass('selected');
                }
                $(event.currentTarget).parent().addClass("selected");
            }
        },

        elemLooseFocus:function (event) {
            $selected = this.findSelected();
            if ($selected && $selected.length != 0) {
                $selected.removeClass('selected');
            }
        }

    });

    return ParticipantListView;
});