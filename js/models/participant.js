define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    var participantModel = Backbone.Model.extend({
        urlRoot:"http://localhost:3000/api/participant",
        defaults:{

        },
        errors:{},

        validate:function (attrs) {
            if (!attrs.firstname || attrs.firstname.length == 0) {
                this.errors.firstname = "You must enter a firstname";
            }
            if (!attrs.lastname || attrs.lastname.length == 0) {
                this.errors.lastname = "You must enter a lastname";            }
        },

        initialize:function () {
        }

    });
    return participantModel;

});
