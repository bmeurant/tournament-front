define([
    'jquery'
], function($) {

    return {
        clearValidationErrors: function() {
            $('.control-group').removeClass("error");
            $('.help-inline').empty();
        }
    };
});