define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    var participantModel = Backbone.Model.extend({
        urlRoot:"http://localhost:3000/api/participant",
        defaults:{

        },
        errors:{},

        initialize:function () {
        }

    });
    return participantModel;

});
