define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'views/participants/edit',
    'pubsub'
], function ($, _, Backbone, Participant, EditView, Pubsub) {

    var ParticipantAddView = EditView.extend({

        type:'add'

    });

    return ParticipantAddView;
});