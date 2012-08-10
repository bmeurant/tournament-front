(function (factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('jquery', 'backbone', 'backbone-validation'));
    } else if (typeof define === 'function' && define.amd) {
        define(['jquery', 'backbone', 'backbone-validation'], factory);
    }
}(function ($, Backbone) {

    /**
     * Backbone Validation extension: Defines custom callbacks for valid and invalid
     * model attributes
     */
    _.extend(Backbone.Validation.callbacks, {
        valid:function (view, attr, selector) {

            // find matching form input and remove error class and text if any
            var attrSelector = '[' + selector + '~=' + attr + ']';
            view.$(attrSelector).parent().parent().removeClass('error');
            view.$(attrSelector + ' + span.help-inline').text('');
        },
        invalid:function (view, attr, error, selector) {

            // find matching form input and add error class and text error
            var attrSelector = '[' + selector + '~=' + attr + ']';
            view.$(attrSelector).parent().parent().addClass('error');
            view.$(attrSelector + ' + span.help-inline').text(error);
        }
    });

}));