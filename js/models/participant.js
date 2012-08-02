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
            this.errors = {};
            if (!attrs.firstname || attrs.firstname.length == 0) {
                this.errors.firstname = "You must enter a firstname";
            }
            if (!attrs.lastname || attrs.lastname.length == 0) {
                this.errors.lastname = "You must enter a lastname";
            }

            if (Object.keys(this.errors).length > 0) {
                return this.errors;
            }
        },

        isValid:function () {
            return Object.keys(this.errors).length == 0;
        },

        initialize:function () {
        }

    });
    return participantModel;

});
