define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'backbone-paginator',
    'collections/participants',
    'text!templates/participants/list-container.html',
    'text!templates/participants/list.html',
    'views/participants/pagination',
    'text!templates/participants/miniature.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, BackbonePaginator, ParticipantsCollection, participantListContainerTemplate, participantListTemplate, PaginationView, participantMiniatureTemplate, Pubsub) {
    var ParticipantListView = Backbone.View.extend({

        template:Handlebars.compile(participantListTemplate),
        containerTemplate:Handlebars.compile(participantListContainerTemplate),
        miniatureTemplate:Handlebars.compile(participantMiniatureTemplate),

        events:{
            "dragstart li.thumbnail[draggable=\"true\"]":"dragStartHandler",
            "focusin ul.thumbnails li.thumbnail a":"elemFocused",
            "focusout ul.thumbnails li.thumbnail a":"elemFocused"
        },

        handlers:[],
        askedPage:1,

        initialize:function (params) {
            this.collection = new ParticipantsCollection;
            this.paginationView = new PaginationView();

            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.participantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CANCELED, this.cancelDeletions.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.NEXT_CALLED, this.selectNext.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PREVIOUS_CALLED, this.selectPrevious.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM_FROM_BAR, this.deleteParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ENTER_CALLED, this.showSelected.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_VIEW, this.participantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.NEW_PAGE, this.newPage.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CONFIRMED, this.render.bind(this)));

            this.initDeleted();

            var self = this;

            Handlebars.registerHelper('if_deleted', function (id, options) {

                if (self.deleted.indexOf(id) >= 0) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });

            Handlebars.registerHelper('disabled', function (id) {
                return (self.deleted.indexOf(id) >= 0) ? 'disabled' : '';
            });

            Handlebars.registerHelper('selected', function (id) {
                return (self.idSelected && self.idSelected == id) ? "selected" : "";
            });

            if (params) {
                if (params.page && utils.isValidPageNumber(params.page)) this.askedPage = parseInt(params.page);
            }
        },

        /**
         * Render this view
         *
         * @param partials optional object containing partial views elements to render. if null, render all
         * @return {*} the current view
         */
        render:function (partials) {

            this.initDeleted();

            // reinit collection to force refresh
            this.collection = new ParticipantsCollection();

            // get the participants collection from server
            this.collection.fetch(
                {
                    success:function () {
                        this.collection.goTo(this.askedPage);
                        this.showTemplate(partials);
                    }.bind(this),
                    error:function (collection, response) {
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
         * @param partials optional object containing partial views elements to display. if null, display all
         */
        showTemplate:function (partials) {

            if (!partials || (partials.participants && partials.pagination)) {
                this.$el.html(this.containerTemplate());
            }

            if (!partials || partials.participants) {
                this.$el.find(".elements").html(this.template({participants:this.collection.toJSON()}));
            }
            if (!partials || partials.pagination) {
                this.$el.find(".pagination").html(this.paginationView.render(this.collection).$el);
            }
            else {
                this.paginationView.render(this.collection);
            }

            // if no element is currently select, select the first one
            var $selected = utils.findSelected(this.$el, "li.thumbnail");
            if (!$selected || $selected.length == 0) {
                utils.selectFirst(this.$el, "li.thumbnail");
            }

            window.history.pushState(null, "Tournament", "/participants" + ((this.collection.info().currentPage != 1) ? "?page=" + this.collection.info().currentPage : ""));

            this.handlers.push(Pubsub.publish(Events.VIEW_CHANGED, ['list']));
        },

        /**
         * Handles deletions cancellation by reintegrating previously deleted elements in the
         * currently displayed list
         */
        cancelDeletions:function () {

            // retrieve and save the currently selected element, if any
            var $selected = utils.findSelected(this.$el, "li.thumbnail");

            if ($selected && $selected.length > 0) {
                this.idSelected = utils.findSelected(this.$el, "li.thumbnail").get(0).id;
            }

            this.initDeleted();

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

            // remove deleted element
            $element.addClass("disabled");
            $("<div>").addClass("foreground").appendTo($element);

            // if the deleted element is selected, select previous
            if ($element.hasClass("selected")) {
                utils.selectPrevious(this.$el, "li.thumbnail");
            }

            // if no element is currently select, select the first one
            var $selected = utils.findSelected(this.$el, "li.thumbnail");
            if (!$selected || $selected.length == 0) {
                utils.selectFirst(this.$el, "li.thumbnail");
            }

        },

        /**
         * Ask for deletion for the currently selected element
         */
        deleteParticipant:function () {

            var $selected = utils.findSelected(this.$el, "li.thumbnail");
            if ($selected && $selected.length > 0) {
                Pubsub.publish(Events.DELETE_ELEM_FROM_VIEW, ['participant', $selected.get(0).id]);
            }
        },

        selectNext:function () {
            utils.selectElement(this.$el, "li.thumbnail", "next");
        },

        selectPrevious:function () {
            utils.selectElement(this.$el, "li.thumbnail", "previous");
        },

        /**
         * Navigates to the details view of the currently selected element
         */
        showSelected:function () {
            var $selected = utils.findSelected(this.$el, "li.thumbnail");
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
                var $selected = utils.findSelected(this.$el, "li.thumbnail");
                if ($selected && $selected.length != 0) {
                    $selected.removeClass('selected');
                }
                $(event.currentTarget).parent().addClass("selected");
            }
        },

        /**
         * Close the current view and any of its embedded components in order
         * to unbind events and handlers that should not be triggered anymore
         */
        close:function () {

            this.paginationView.close();

            Backbone.View.prototype.close.apply(this, arguments);
        },

        newPage:function (id) {
            this.askedPage = id;
            this.render({participants:true});
        },

        initDeleted:function () {
            // get the list of current deleted elements from local storage in order to exclude these
            // elements from rendered view
            this.deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
            if (!this.deleted) {
                this.deleted = [];
            }
        }

    });

    return ParticipantListView;
});