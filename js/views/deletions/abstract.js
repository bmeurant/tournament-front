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
            if (!this.collection) {
                this.emptyCollection();
            }
            this.storeInLocalStorage();
        },

        emptyCollection:function () {
            this.collection.participant = [];
        },

        getFromLocalStorage:function () {
            this.collection = JSON.parse(localStorage.getItem('deletedElements'));
        },

        storeInLocalStorage:function () {
            localStorage.setItem('deletedElements', JSON.stringify(this.collection));
        }

    });

    return AbstractDeletionView;
});