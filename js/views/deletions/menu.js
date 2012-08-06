define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/deletions/menu.html',
    'views/deletions/abstract',
    'models/participant',
    'pubsub'
], function ($, _, Backbone, Handlebars, deletionsMenuTemplate, AbstractView, Participant, Pubsub) {
    var DeletionsMenuView = AbstractView.extend({

        menuTemplate:Handlebars.compile(deletionsMenuTemplate),
        nbDelsSelector:".nb-dels",

        handlers:[],

        // For these main view types, the deletion menu will be completely rendered
        acceptedTypes:['details', 'edit', 'list'],

        events:{
            "drop #deleteDropZone":"onDrop",
            "dragover #deleteDropZone":"onDragOver",
            "dragleave #deleteDropZone":"onDragLeave",
            "click .delete-actions.cancel":"cancelDeletions",
            "click .delete-actions.confirm":"confirmDeletions",
            "click .delete":"removeElement"
        },

        initialize:function () {

            // call inherited constructor
            AbstractView.prototype.initialize.apply(this, arguments);
            this.events = _.extend({}, AbstractView.prototype.events, this.events);
            this.handlers = _.extend([], AbstractView.prototype.handlers, this.handlers);

            this.$el = $("<ul>").addClass("nav");
            this.el = this.$el.get(0);

            // Default type
            this.type = "no";


            // Register PubSub bindings
            this.handlers.push(Pubsub.subscribe(Events.DRAG_START, this.onDragStart.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DRAG_END, this.onDragEnd.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_VIEW, this.renderDels.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_POPULATED, this.render.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETION_CANCELED, this.render.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.VIEW_CHANGED, this.onViewChanged.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CALLED, this.moveToDeletionsView.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.CONFIRM_DELS_CALLED, this.confirmDeletions.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.CANCEL_DELS_CALLED, this.cancelDeletions.bind(this)));

        },

        /**
         * Redraw deletions menu when main view change
         * @param type type of the main view
         */
        onViewChanged:function (type) {
            this.type = type;
            this.render();

            // if the new type is not managed by the view, hide it
            if (this.acceptedTypes.indexOf(type) < 0) {
                this.$el.find(".delete-menu.drop-zone").addClass("hidden");
            }
        },

        render:function () {
            this.$el.html(this.menuTemplate());
            this.initCollection();
            this.renderDels();
            return this;
        },

        /**
         * Emphasize drop zone on drag start
         */
        onDragStart:function () {
            $('.drop-zone').addClass('emphasize');
        },

        /**
         * Handles dropping element on drop zone
         * @param event
         */
        onDrop:function (event) {
            event.stopPropagation();
            event.preventDefault();

            // get transfered data
            var id = event.originalEvent.dataTransfer.getData('id');
            var type = event.originalEvent.dataTransfer.getData('type');

            // handles element deletion or ignore any other dropped element
            if ((id != null) && (id != "")) {
                this.deleteElement(type, id);
                Pubsub.publish(Events.REMOVE_ALERT);
            }

            this.onDragEnd(type, id);
        },

        /**
         * Delete the given element
         *
         * @param type type of the element to delete
         * @param id id of the element to delete
         */
        deleteElement:function (type, id) {
            this.initCollection();
            this.addToCollection(type, id);
            this.storeInLocalStorage();
        },

        /**
         * Refresh view after drop
         *
         * @param type type of the deleted element
         * @param id if of the deleted element
         */
        onDragEnd:function (type, id) {
            $('.drop-zone').removeClass('emphasize');
            this.clearDropZone();
            this.renderDels();
            Pubsub.publish(Events.ELEM_DELETED_FROM_BAR, [id, type]);
        },

        /**
         * Handles drag over drop zone
         *
         * @param event event raised
         * @return {Boolean} false to prevent default browser behaviour
         */
        onDragOver:function (event) {
            event.preventDefault(); // allows us to drop
            event.originalEvent.dataTransfer.dropEffect = 'move';
            this.emphasizeDropZone();
            return false;
        },

        /**
         * Handles drag leave from drop zone
         *
         * @param event event raised
         * @return {Boolean} false to prevent default browser behaviour
         */
        onDragLeave:function (event) {
            event.preventDefault(); // allows us to drop
            event.originalEvent.dataTransfer.dropEffect = 'move';
            this.clearDropZone();
            return false;
        },

        /**
         * Strong emphasize of drop zone (example: on drag over)
         */
        emphasizeDropZone:function () {
            $('.drop-zone').addClass("dropable");
            $('.drop-zone a').addClass("dropable");
        },

        /**
         * Remove strong emphasize of drop zone (exemple: on drag leave)
         */
        clearDropZone:function () {
            $('.drop-zone').removeClass("dropable");
            $('.drop-zone a').removeClass("dropable");
        },

        /**
         * Refresh dels number badge component
         */
        renderDels:function () {
            this.getFromLocalStorage();
            var nbDels = this.countElements(this.collection);
            $(this.nbDelsSelector).text(nbDels);
            nbDels > 0 ? $(".delete-actions").removeClass("hidden") : $(".delete-actions").addClass("hidden");
        },

        /**
         * Handles deletion confirmation (example: confirm button click)
         *
         * @param event event raised
         */
        confirmDeletions:function (event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            this.initCollection();
            this.emptyErrors();
            this.deleteElements();

        },

        /**
         * Effective deletion of all element ids stored in the collection
         */
        deleteElements:function () {

            var self = this;
            var nbWaitingCallbacks = 0;

            $.each(this.collection, function (type, idArray) {
                $.each(idArray, function (index, currentId) {
                    nbWaitingCallbacks += 1;

                    $.ajax({
                        url:'http://localhost:3000/api/participant/' + currentId,
                        type:'DELETE'
                    })
                        .done(function () {
                            nbWaitingCallbacks -= 1;
                            self.afterRemove(nbWaitingCallbacks);
                        })
                        .fail(function (jqXHR) {
                            if (jqXHR.status != 404) {
                                self.recordError(type, currentId);
                            }
                            nbWaitingCallbacks -= 1;
                            self.afterRemove(nbWaitingCallbacks);
                        });
                });
            });
        },

        /**
         * Callback called after an ajax deletion request
         *
         * @param nbWaitingCallbacks number of callbacks that we have still to wait before close request
         */
        afterRemove:function (nbWaitingCallbacks) {

            // if there is still callbacks waiting, do nothing. Otherwise it means that all request have
            // been performed : we can manage global behaviours
            if (nbWaitingCallbacks == 0) {
                this.reintegrateErrors();

                this.render();

                Pubsub.publish(Events.DELETIONS_CONFIRMED);
            }

        },

        /**
         * Handles errors and reintegrate elements ids that could not be deleted into the main collection
         */
        reintegrateErrors:function () {

            var initialCollectionLength = this.countElements(this.collection);

            this.emptyCollection();

            var countErrors = this.countElements(this.errors);
            if (countErrors != 0) {

                var self = this;

                // each element in error is added to main collection in order to keep it synchonized with server
                // state
                $.each(this.errors, function (type, idArray) {
                    $.each(idArray, function (index, model) {
                        self.addToCollection(type, model.id);
                    });
                });

                // adapt error messages
                if (countErrors == initialCollectionLength) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'Error occured while deleting these elements', 'alert-error']);
                }
                else {
                    Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Error occured while deleting some elements', 'alert-warning']);
                }
            }
            else {
                Pubsub.publish(Events.ALERT_RAISED, ['Success!', 'Elements successfully deleted', 'alert-success']);
            }


            // save collection
            this.storeInLocalStorage();

            this.render();
        },

        /**
         * Handles deletions cancelation (example: cancel button clicked)
         *
         * @param event event raised
         */
        cancelDeletions:function (event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            this.emptyCollection();
            this.storeInLocalStorage();

            this.render();

            Pubsub.publish(Events.ALERT_RAISED, ['Success!', 'Deletion canceled', 'alert-success']);
            Pubsub.publish(Events.DELETIONS_CANCELED);
        },

        /**
         * Handles a click on delete button
         * @param event event raised
         */
        removeElement:function (event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.publish(Events.DELETE_ELEM_FROM_BAR);
        },

        /**
         * Handles call to deletion view (example: from Keyboard shortcut)
         */
        moveToDeletionsView:function () {
            Backbone.history.navigate("/deletions", true);
        }

    });

    return DeletionsMenuView;
});