define([
    'underscore',
    'backbone',
    'i18n!nls/messages',
    'resthub-backbone-validation'
], function(_, Backbone, messages) {

    /**
     * Definition of a Participant model object
     */
    return Backbone.Model.extend({
        urlRoot: App.Config.serverRootURL + '/participant',
        defaults: {

        },

        // Defines validation options (see Backbone-Validation)
        validation: {
            firstname: {
                required: true,
                msg: _.str.sprintf(messages.required, messages.firstname)
            },
            lastname: {
                required: true,
                msg: _.str.sprintf(messages.required, messages.lastname)
            },
            email: {
                required: false,
                pattern: 'email',
                msg: messages.invalidEmail
            }
        },

        initialize: function() {
        }

    });

});
