define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'collections/participants',
    'text!templates/participants/list.html',
    'text!templates/participants/miniature.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, participantsCollection, participantListTemplate, participantMiniatureTemplate, Pubsub) {
    var ParticipantListView = Backbone.View.extend({

        template:Handlebars.compile(participantListTemplate),
        miniatureTemplate:Handlebars.compile(participantMiniatureTemplate),

        events:{
            "dragstart li.thumbnail[draggable=\"true\"]":"dragStartHandler",
            "focusin ul.thumbnails li.thumbnail a":"elemFocused",
            "focusout ul.thumbnails li.thumbnail a":"elemFocused"
        },

        handlers:[],

        initialize:function () {
            this.collection = participantsCollection;

            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.participantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CANCELED, this.cancelDeletions.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.NEXT_CALLED, this.selectNext.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PREVIOUS_CALLED, this.selectPrevious.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM_FROM_BAR, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ENTER_CALLED, this.showSelected.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_VIEW, this.participantDeleted.bind(this)));

            Handlebars.registerHelper('if_deleted', function (id, options) {

                // get the list of current deleted elements from local storage in order to exclude these
                // elements from rendered view
                var deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
                if (!deleted) {
                    deleted = [];
                }

                if (deleted.indexOf(id) >= 0) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });

            Handlebars.registerHelper('unless_deleted', function (id, options) {
                var fn = options.fn, inverse = options.inverse;
                options.fn = inverse;
                options.inverse = fn;

                return Handlebars.helpers['if_deleted'].call(this, id, options);
            });

            var self = this;

            Handlebars.registerHelper('selected', function (id) {
                return (self.idSelected && self.idSelected == id) ? "selected" : "";
            });
        },

        /**
         * Render this view
         *
         * @param idSelected optional id of the participant element to select
         * @return {*} the current view
         */
        render:function () {

            // get the participants collection from server
            this.collection.fetch(
                {
                    success:function () {
                        this.showTemplate();
                    }.bind(this),
                    error:function () {
                        Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                    }
                });
            return this;
        },

        /**
         * Handles drag start on a participant element
         *
         * @param event event raised
         */
        dragStartHandler:function (event) {
            event.originalEvent.dataTransfer.effectAllowed = 'move'; // only dropEffect='copy' will be dropable

            // get id of the dragged element and set transfer data
            var id = event.currentTarget.getAttribute('id');
            event.originalEvent.dataTransfer.setData('id', id);
            event.originalEvent.dataTransfer.setData('type', 'participant');

            // get corresponding model
            var participant = this.getModel(id);

            // create miniature shown during drag
            // this miniature must be already rendered by the browser and not hidden -> should be positioned
            // out of visible page
            // To embed remote image, this should be cacheable and the remote server should implement the
            // corresponding cache politic
            var dragIcon = $("#dragIcon");
            dragIcon.html(this.miniatureTemplate({participant:participant.toJSON()}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 25, 25);

            Pubsub.publish(Events.DRAG_START);
        },

        /**
         * @param id
         * @return {*} the model object in models collection from its id
         */
        getModel:function (id) {
            var mod = null;
            $.each(this.collection.models, function (index, model) {
                if (model.id == id) {
                    mod = model;
                    return false;
                }
            });
            return mod;
        },

        /**
         * @param idSelected optional id of the participant element to select
         */
        showTemplate:function () {

            this.$el.html(this.template({participants:this.collection.toJSON()}));

            // if no element is currently select, select the first one
            var $selected = this.findSelected();
            if (!$selected || $selected.length == 0) {
                this.selectFirst();
            }

            this.handlers.push(Pubsub.publish(Events.VIEW_CHANGED, ['list']));
        },

        /**
         * Handles deletions cancellation by reintegrating previously deleted elements in the
         * currently displayed list
         */
        cancelDeletions:function () {

            // retrieve and save the currently selected element, if any
            var $selected = this.findSelected();

            if ($selected && $selected.length > 0) {
                this.idSelected = this.findSelected().get(0).id;
            }

            // re-render view selecting the previously selected element
            this.render();
        },

        /**
         * Handles effective deletion of a list element (exemple: after a dra-drop or a del.)
         *
         * @param id deleted participant id
         */
        participantDeleted:function (id) {
            var $element = $('#' + id);

            // if the deleted element is selected, select previous
            if ($element.hasClass("selected")) {
                this.selectPrevious();
            }

            // remove deleted element
            $element.remove();

            // if no element is currently select, select the first one
            var $selected = this.findSelected();
            if (!$selected || $selected.length == 0) {
                this.selectFirst();
            }

        },

        /**
         * Select an element
         *
         * @param type optional selection type : 'previous' or 'next'. Otherwise or null : 'next'
         */
        selectElement:function (type) {

            // get currently selected element. If no, select the first one
            var $selected = this.findSelected();
            if (!$selected || $selected.length == 0) {
                this.selectFirst();
                return;
            }

            // get the element to select and, if any, select it and give it focus
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
            // select the element, remove focus from others and give it focus
            if ($toselect && $toselect.length != 0) {
                $('*:focus').blur();
                $toselect.addClass("selected").focus();
            }
        },

        findSelected:function () {
            return this.$el.find("li.thumbnail.selected");
        },

        /**
         * @return {*} the first element after the currently selected one
         */
        findNextSelect:function () {
            return this.$el.find("li.thumbnail.selected + li.thumbnail");
        },

        /**
         * @return {*} the first element before the currently selected one
         */
        findPreviousSelect:function () {
            var previous = this.$el.find("li.thumbnail.selected").get(0).previousElementSibling;
            if (previous) {
                return this.$el.find('#' + previous.id);
            }
            return null;
        },

        /**
         * Ask for deletion for the currently selected element
         */
        deleteParticipant:function () {

            var $selected = this.findSelected();
            if ($selected && $selected.length > 0) {
                this.participantDeleted($selected.get(0).id);

                Pubsub.publish(Events.DELETE_ELEM_FROM_VIEW, ['participant', $selected.get(0).id]);
            }
        },

        /**
         * Navigates to the details view of the currently selected element
         */
        showSelected:function () {
            var $selected = this.findSelected();
            if ($selected && $selected.length > 0) {
                Backbone.history.navigate('/participant/' + $selected.get(0).id, true);
            }
        },

        /**
         * Give 'focus' on the currently selected element.
         * Remove focus if no element selected
         *
         * @param event event raised
         */
        elemFocused:function (event) {
            if (event && event.currentTarget) {
                var $selected = this.findSelected();
                if ($selected && $selected.length != 0) {
                    $selected.removeClass('selected');
                }
                $(event.currentTarget).parent().addClass("selected");
            }
        }

    });

    return ParticipantListView;
});