define([
    'jquery'
], function($) {

    return {
        clearValidationErrors: function() {
            this.$('.control-group').removeClass("error");
            this.$('.help-inline').empty();
        }
    };
});