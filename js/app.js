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

        Backbone.View.close = function () {
            if (this.beforeClose) {
                this.beforeClose();
            }
            this.remove();
            this.unbind();
        };

        classes.Views.HeaderView = new HeaderView($('.header'));
        classes.Views.DeletionsMenuView = new DeletionsMenuView($('.element-menu.delete-menu'));
        classes.Views.DeletionsView = new DeletionsView($('#content'));
        classes.Views.AlertsView = new AlertsView($('.alerts'));
        classes.Controllers.KeyboardController = new KeyboardController();

        // Pass in our Router module and call it's initialize function
        Router.initialize();
    }

    return {
        initialize:initialize
    };
});