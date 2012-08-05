define([
    'underscore',
    'backbone',
    'backbone-validation'
], function (_, Backbone, BackboneValidation) {
    var participantModel = Backbone.Model.extend({
        urlRoot:"http://localhost:3000/api/participant",
        defaults:{

        },
        validation:{
            firstname:{
                required:true
            },
            lastname:{
                required:true
            },
            email:{
                required:false,
                pattern:'email'
            }
        },

        initialize:function () {
        }

    });
    return participantModel;

});
