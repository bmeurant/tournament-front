define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'views/header',
    'views/deletions/menu',
    'views/deletions/deletions',
    'views/alerts',
    'controllers/keyboard',
    'pubsub'
], function ($, _, Backbone, Router, HeaderView, DeletionsMenuView, DeletionsView, AlertsView, KeyboardController, Pubsub) {
    var initialize = function () {

        Backbone.View.prototype.close = function () {
            alert('close '+this.type);
            if (this.beforeClose) {
                this.beforeClose();
            }
            if (this.handlers) {
                $.each(this.handlers, function (index, value) {
                    Pubsub.unsubscribe(value);
                });
            }
            if (this.model) {
                this.model.unbind();
            }
            this.remove();
            this.unbind();
        };

        classes.Views.HeaderView = new HeaderView();
        $('.header').html(classes.Views.HeaderView.render().el);
        classes.Views.DeletionsView = new DeletionsView();
        //$('#content').html(classes.Views.DeletionsView.render().el);
        classes.Views.AlertsView = new AlertsView();
        $('.alerts').html(classes.Views.AlertsView.render().el);
        classes.Controllers.KeyboardController = new KeyboardController();

        // Pass in our Router module and call it's initialize function
        Router.initialize();
    }

    return {
        initialize:initialize
    };
});