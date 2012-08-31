define([
    'jquery',
    'backbone',
    'models/participant'
], function($, Backbone, Participant) {

    /**
     * 'Abstract' view defining global controls, events, handlers and methods for 'concrete'
     * deletion views
     *
     */
    return Backbone.View.extend({

        initialize: function() {
            this.initCollection();
        },

        /**
         * Initializes collection from local storage state or creates an empty one
         */
        initCollection: function() {
            this.getFromLocalStorage();
            if (!this.idsCollection || Object.keys(this.idsCollection).length == 0) {
                this.emptyCollection();
            }
            this.storeInLocalStorage();
        },

        /**
         * Creates an empty collection with the correct format
         */
        emptyCollection: function() {
            this.idsCollection = {};
            this.idsCollection.participant = [];
        },

        /**
         * Retrieve collection from local storage
         */
        getFromLocalStorage: function() {
            this.idsCollection = JSON.parse(localStorage.getItem('deletedElements'));
        },

        /**
         * Save current collection state in local storage
         */
        storeInLocalStorage: function() {
            localStorage.setItem('deletedElements', JSON.stringify(this.idsCollection));
        },

        /**
         * Add a given element to the current collection if not already contained
         *
         * @param elemType type of the element to add
         * @param id id of the element to add
         */
        addToCollection: function(elemType, id) {
            // initialize collection elemType hash key if not exists
            if (!this.idsCollection[elemType]) {
                this.idsCollection[elemType] = [];
            }

            // if the collection does not already contains the element, add it.
            if (this.idsCollection[elemType].indexOf(id) < 0) {
                this.idsCollection[elemType].push(id);
            }
        },

        /**
         * @param collection
         * @return {Number} the number of elements of the given collection
         */
        countElements: function(collection) {
            var elements = 0;
            $.each(collection, function(index, value) {
                elements += value.length;
            });
            return elements;
        },

        deleteFromServer: function(model, deleteCallback) {
            var type = this.getModelType(model);

            model.destroy({
                wait: true,
                success: function(model) {
                    deleteCallback(null, {type: 'success', model: model});
                },
                error: function(model, response) {
                    if (response.status == 404) {
                        // element obviously already deleted from server. Ignore it and remove from
                        // local collection
                        this.idsCollection[type].remove(model);
                    }
                    else {
                        deleteCallback(null, {type: 'error', model: model});
                    }
                }.bind(this)
            });
        },

        getModelType: function(model) {
            if (model instanceof Participant) return 'participant';
            return null;
        },

        getClassFromType: function(type) {
            if (type == 'participant') return Participant;
            return null;
        }

    });
});