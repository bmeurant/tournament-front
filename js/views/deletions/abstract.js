define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/miniature.html',
    'pubsub'
], function ($, _, Backbone, Participant, participantMiniatureTemplate, Pubsub) {

    var AbstractDeletionView = Backbone.View.extend({

        events:{
        },

        handlers:[],

        initialize:function (el) {
            this.setElement(el);
            this.initCollection();
            this.emptyErrors();
        },

        /**
         * Initializes collection from local storage state or creates an empty one
         */
        initCollection:function () {
            this.getFromLocalStorage();
            if (!this.collection || Object.keys(this.collection).length == 0) {
                this.emptyCollection();
            }
            this.storeInLocalStorage();
        },

        /**
         * Creates an empty errors collection with the correct format
         */
        emptyErrors:function () {
            this.errors = {};
            this.errors.participant = [];
        },

        /**
         * Creates an empty collection with the correct format
         */
        emptyCollection:function () {
            this.collection = {};
            this.collection.participant = [];
        },

        /**
         * Retrieve collection from local stotage
         */
        getFromLocalStorage:function () {
            this.collection = JSON.parse(localStorage.getItem('deletedElements'));
        },

        /**
         * Save current collection state in local storage
         */
        storeInLocalStorage:function () {
            localStorage.setItem('deletedElements', JSON.stringify(this.collection));
        },

        /**
         * Add a given element to the current collection if not already contained
         *
         * @param type: type of the element to add
         * @param id: id of the element to add
         */
        addToCollection:function (type, id) {

            // initialize collection type hash key if not exists
            if (!this.collection[type]) {
                this.collection[type] = [];
            }

            // if the collection does not already contains the element, add it.
            if (this.collection[type].indexOf(id) < 0) {
                this.collection[type].push(id);
            }
        },

        /**
         * Record a new error for a given element
         *
         * @param type: type of the element to record
         * @param id: id of the element to record
         */
        recordError:function (type, id) {
            if (this.errors[type].indexOf(id) < 0)
                this.errors[type].push(id);
        },

        /**
         * @param collection
         * @return {Number} : the number of elements of the given collection
         */
        countElements:function (collection) {
            var elements = 0;
            $.each(collection, function (index, value) {
                elements += value.length;
            });
            return elements;
        }

    });

    return AbstractDeletionView;
});