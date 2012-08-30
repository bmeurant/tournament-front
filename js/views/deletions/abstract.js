define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {

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
            if (!this.elemCollection || Object.keys(this.elemCollection).length == 0) {
                this.emptyCollection();
            }
            this.storeInLocalStorage();
        },

        /**
         * Creates an empty collection with the correct format
         */
        emptyCollection: function() {
            this.elemCollection = {};
            this.elemCollection.participant = [];
        },

        /**
         * Retrieve collection from local storage
         */
        getFromLocalStorage: function() {
            this.elemCollection = JSON.parse(localStorage.getItem('deletedElements'));
        },

        /**
         * Save current collection state in local storage
         */
        storeInLocalStorage: function() {
            localStorage.setItem('deletedElements', JSON.stringify(this.elemCollection));
        },

        /**
         * Add a given element to the current collection if not already contained
         *
         * @param elemType type of the element to add
         * @param id id of the element to add
         */
        addToCollection: function(elemType, id) {

            // initialize collection elemType hash key if not exists
            if (!this.elemCollection[elemType]) {
                this.elemCollection[elemType] = [];
            }

            // if the collection does not already contains the element, add it.
            if (this.elemCollection[elemType].indexOf(id) < 0) {
                this.elemCollection[elemType].push(id);
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

        deleteFromServer: function(elem, deleteCallback) {
            $.ajax({
                url: App.Config.serverRootURL + '/' + elem.type + '/' + elem.id,
                type: 'DELETE'
            })
                .done(function() {
                    deleteCallback(null, {type: 'success', elem: elem});
                })
                .fail(function(jqXHR) {
                if (jqXHR.status == 404) {
                    // element obviously already deleted from server. Ignore it and remove from local collection
                    this.elemCollection[elem.type].splice(elem.index, 1);
                }

                // callback is called with null error parameter because otherwise it breaks the
                // loop and stop on first error :-(
                deleteCallback(null, {type: 'error', elem: elem});
            }.bind(this));
        }

    });
});