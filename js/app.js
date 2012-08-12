define([
    'jquery',
    'underscore',
    'backbone.ext',
    'backbone-validation.ext',
    'router',
    'views/header',
    'views/alerts',
    'views/help/shortcuts',
    'views/footer',
    'controllers/keyboard',
    'handlebars',
    'handlebars.helpers'
], function ($, _, BackboneExtension, BackboneValidation, Router, HeaderView, AlertsView, ShortcutsView, FooterView, KeyboardController, Handlebars) {
        var initialize = function () {

            Handlebars.registerHelper('photo_link', function (picture_url) {
                return "http://localhost:3000/api" + picture_url;
            });

            // Define global singleton views
            App.Views.HeaderView = new HeaderView();
            App.Views.FooterView = new FooterView();
            $('footer').html(App.Views.FooterView.render().el);
            App.Views.ShortcutsView = new ShortcutsView();
            $('.header').html(App.Views.HeaderView.render().el);
            App.Views.AlertsView = new AlertsView();
            $('.alerts').html(App.Views.AlertsView.render().el);
            App.Controllers.KeyboardController = new KeyboardController();

            // Pass in our Router module and call it's initialize function
            Router.initialize();
        };

        return {
            initialize:initialize
        };
    }
);