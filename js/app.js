define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'views/header',
    'views/deletions/menu',
    'views/deletions/deletions',
    'views/alerts',
    'pubsub'
], function ($, _, Backbone, Router, HeaderView, DeletionsMenuView, DeletionsView, AlertsView, Pubsub) {
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

        // Pass in our Router module and call it's initialize function
        Router.initialize();
    }

    return {
        initialize:initialize
    };
});