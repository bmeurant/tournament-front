define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/deletions/menu.html',
    'views/deletions/abstract',
    'models/participant',
    'pubsub',
    'async'
], function ($, _, Backbone, Handlebars, deletionsMenuTemplate, AbstractView, Participant, Pubsub) {

    return AbstractView.extend({

        menuTemplate:Handlebars.compile(deletionsMenuTemplate),
        nbDelsSelector:".nb-dels",

        handlers:[],

        // For these main view types, the deletion menu will be completely rendered
        acceptedTypes:['details', 'edit', 'list'],
        ignoreElemTypes:['deletions'],

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

            // Register PubSub bindings
            this.handlers.push(Pubsub.subscribe(App.Events.DRAG_START, this.onDragStart.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.DRAG_END, this.onDragEnd.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.DELETIONS_POPULATED, this.renderDels.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.DELETION_CANCELED, this.renderDels.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.DELETION_CONFIRMED, this.renderDels.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.VIEW_CHANGED, this.onViewChanged.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.DELETIONS_CALLED, this.moveToDeletionsView.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.CONFIRM_DELS_CALLED, this.confirmDeletions.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.CANCEL_DELS_CALLED, this.cancelDeletions.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.DELETE_ELEM_FROM_VIEW, this.deleteElem.bind(this)));

        },

        /**
         * Redraw deletions menu when main view change
         * @param elemType type of the element managed by the main view
         * @param viewType type of the main view
         */
        onViewChanged:function (elemType, viewType) {
            this.render();

            // if the new type is not managed by the view, hide it
            if (this.ignoreElemTypes.indexOf(elemType) >= 0 || this.acceptedTypes.indexOf(viewType) < 0) {
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
         * Remove a given element from the list of elements to delete and from the current view
         *
         * @param elemType type of the current element
         * @param id id of the current element
         */
        deleteElem:function (elemType, id) {
            this.initCollection();
            this.addToCollection(elemType, id);
            this.storeInLocalStorage();
            this.renderDels();

            Pubsub.publish(App.Events.ELEM_DELETED_FROM_BAR, [id]);
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
            var elemType = event.originalEvent.dataTransfer.getData('elemType');

            // handles element deletion or ignore any other dropped element
            if ((id != null) && (id != "")) {
                this.deleteElement(elemType, id);
                Pubsub.publish(App.Events.REMOVE_ALERT);
            }

            this.onDragEnd(elemType, id);
        },

        /**
         * Delete the given element
         *
         * @param elemType type of the element to delete
         * @param id id of the element to delete
         */
        deleteElement:function (elemType, id) {
            this.initCollection();
            this.addToCollection(elemType, id);
            this.storeInLocalStorage();
        },

        /**
         * Refresh view after drop
         *
         * @param elemType type of the deleted element
         * @param id if of the deleted element
         */
        onDragEnd:function (elemType, id) {
            $('.drop-zone').removeClass('emphasize');
            if (elemType && id) {
                this.clearDropZone();
                this.renderDels();
                Pubsub.publish(App.Events.ELEM_DELETED_FROM_BAR, [id, elemType]);
            }
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
            $('.drop-zone').addClass("droppable");
            $('.drop-zone a').addClass("droppable");
        },

        /**
         * Remove strong emphasize of drop zone (exemple: on drag leave)
         */
        clearDropZone:function () {
            $('.drop-zone').removeClass("droppable");
            $('.drop-zone a').removeClass("droppable");
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
            this.deleteElements();

        },

        /**
         * Effective deletion of all element ids stored in the collection
         */
        deleteElements:function () {

            var elements = [];

            $.each(this.collection, function (type, idArray) {
                $.each(idArray, function (index, currentId) {
                    elements.push({type:type, id:currentId, index:index});
                }.bind(this));
            }.bind(this));

            async.map(elements, this.deleteFromServer.bind(this), this.afterRemove.bind(this));
        },

        /**
         * Callback called after all ajax deletion requests
         *
         * @param err always null because default behaviour break map on first error
         * @param results array of fetched models : contain null value in cas of error
         */
        afterRemove:function (err, results) {

            var initialCollectionLength = this.countElements(this.collection);
            this.emptyCollection();

            $.each(results, function (index, result) {

                if (result.type == "error") {
                    this.addToCollection(result.elem.type, result.elem.id);
                }

            }.bind(this));

            var finalCollectionLength = this.countElements(this.collection);

            if (finalCollectionLength == 0) {
                Pubsub.publish(App.Events.ALERT_RAISED, ['Success!', 'Elements successfully deleted', 'alert-success']);
            }
            else if (finalCollectionLength == initialCollectionLength) {
                Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'Error occurred while deleting these elements', 'alert-error']);
            }
            else {
                Pubsub.publish(App.Events.ALERT_RAISED, ['Warning!', 'Error occurred while deleting some elements', 'alert-warning']);
            }

            // save collection
            this.storeInLocalStorage();

            this.render();

            Pubsub.publish(App.Events.DELETIONS_CONFIRMED);

        },

        /**
         * Handles deletions cancellation (example: cancel button clicked)
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

            Pubsub.publish(App.Events.ALERT_RAISED, ['Success!', 'Deletion canceled', 'alert-success']);
            Pubsub.publish(App.Events.DELETIONS_CANCELED);
        },

        /**
         * Handles a click on delete button
         * @param event event raised
         */
        removeElement:function (event) {
            event.stopPropagation();
            event.preventDefault();
            Pubsub.publish(App.Events.DELETE_ELEM_FROM_BAR);
        },

        /**
         * Handles call to deletion view (example: from Keyboard shortcut)
         */
        moveToDeletionsView:function () {
            Backbone.history.navigate("/deletions", true);
        }

    });
});