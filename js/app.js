define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'views/header',
    'views/deletions/menu',
    'views/deletions/deletions',
    'views/alerts',
    'views/help/shortcuts',
    'views/footer',
    'controllers/keyboard',
    'handlebars.helpers',
    'pubsub'
], function ($, _, Backbone, Router, HeaderView, DeletionsMenuView, DeletionsView, AlertsView, ShortcutsView, FooterView, KeyboardController, HandleBarsHelpers, Pubsub) {
        var initialize = function () {

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

            // Define global singleton views
            classes.Views.HeaderView = new HeaderView();
            classes.Views.FooterView = new FooterView();
            $('footer').html(classes.Views.FooterView.render().el);
            classes.Views.ShortcutsView = new ShortcutsView();
            $('.header').html(classes.Views.HeaderView.render().el);
            classes.Views.AlertsView = new AlertsView();
            $('.alerts').html(classes.Views.AlertsView.render().el);
            classes.Controllers.KeyboardController = new KeyboardController();

            // Pass in our Router module and call it's initialize function
            Router.initialize();
        };

        return {
            initialize:initialize
        };
    }
)
;