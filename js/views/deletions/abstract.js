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
        },

        initCollection:function () {
            this.getFromLocalStorage();
            if (!this.collection || Object.keys(this.collection).length == 0) {
                this.emptyCollection();
            }
            this.storeInLocalStorage();
        },

        emptyCollection:function () {
            this.collection = {};
            this.collection.participant = [];
        },

        getFromLocalStorage:function () {
            this.collection = JSON.parse(localStorage.getItem('deletedElements'));
        },

        storeInLocalStorage:function () {
            localStorage.setItem('deletedElements', JSON.stringify(this.collection));
        },

        addToCollection:function (type, id) {

            if (!this.collection[type]) {
                this.collection[type] = [];
            }

            if (this.collection[type].indexOf(id) < 0) {
                this.collection[type].push(id);
            }
        },

    });

    return AbstractDeletionView;
});