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
            if (Backbone.Validation) {
                Backbone.Validation.unbind(this);
            }
            this.model.unbind();
        }

        // remove html content
        this.remove();

        // unbind view events
        this.undelegateEvents();

        // optionally call a post close method if exists
        if (this.afterClose) {
            this.afterClose();
        }
    };

    // force all links to be handled by Backbone pushstate - no get will be send to server
    $(document).on('click', 'a:not([data-bypass])', function (evt) {

        if (Backbone.history.options.pushState) {

            var href = this.href;
            var protocol = this.protocol + '//';
            href = href.slice(protocol.length);
            href = href.slice(href.indexOf("/") + 1);

            if (href.slice(protocol.length) !== protocol) {
                evt.preventDefault();
                Backbone.history.navigate(href, true);
            }
        }
    });

}));