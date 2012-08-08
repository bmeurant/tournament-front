define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'router',
    'views/header',
    'views/deletions/menu',
    'views/deletions/deletions',
    'views/alerts',
    'views/help/shortcuts',
    'views/footer',
    'controllers/keyboard',
    'pubsub'
], function ($, _, Backbone, Handlebars, Router, HeaderView, DeletionsMenuView, DeletionsView, AlertsView, ShortcutsView, FooterView, KeyboardController, Pubsub) {
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

            /**
             * Register custom handlebars helpers
             */
            Handlebars.registerHelper('photo_link', function (picture_url) {
                return "http://localhost:3000/api" + picture_url;
            });

            Handlebars.registerHelper('if_cond', function (value1, value2, options) {
                if (value1 == value2) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });

            Handlebars.registerHelper('unless_cond', function (value1, value2, options) {
                var fn = options.fn, inverse = options.inverse;
                options.fn = inverse;
                options.inverse = fn;

                return Handlebars.helpers['if_cond'].call(this, value1, value2, options);
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