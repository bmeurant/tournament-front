define([
    'underscore',
    'backbone',
    'backbone-validation'
], function (_, Backbone) {

    /**
     * Definition of a Participant model object
     */
    return Backbone.Model.extend({
        urlRoot:"http://localhost:3000/api/participant",
        defaults:{

        },

        // Defines validation options (see Backbone-Validation)
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

});
