define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant'
], function ($, _, Backbone, participantModel) {

    /**
     * Collection of Participant model objects
     */
    var participantsCollection = Backbone.Collection.extend({
        model:participantModel,
        url:"http://localhost:3000/api/participants",

        initialize:function () {

        }

    });

    return new participantsCollection;
});