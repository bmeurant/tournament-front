(function (factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('jquery', 'backbone', 'backbone-validation', 'pubsub'));
    } else if (typeof define === 'function' && define.amd) {
        define(['jquery', 'backbone', 'backbone-validation', 'pubsub'], factory);
    }
}(function ($, Backbone, BackboneValidation, Pubsub) {

    /**
     *  Backbone extension:
     *
     *  Defines a new function close properly cleaning current active view.
     *      - remove validation and model bindings, if any
     *      - remove PubSub bindings, if any
     *      - remove view bindings, if any
     *      - remove this.el
     */
    Backbone.View.prototype.close = function () {

        // optionally call a pre close method if exists
        if (this.beforeClose) {
            this.beforeClose();
        }

        // unsubscribe all PubSub events. Otherwise these events would still be launched and listened
        // and unexpected  handlers would be called conducing to perform a same action twice or more
        if (this.handlers) {
            $.each(this.handlers, function (index, value) {
                Pubsub.unsubscribe(value);
            });
        }

        // unbind all model (if exists) and validation events
        if (this.model && this.model.unbind) {
            Backbone.Validation.unbind(this);
            this.model.unbind();
        }

        // remove html content
        this.remove();

        // unbind view events
        this.unbind();
    };

}));