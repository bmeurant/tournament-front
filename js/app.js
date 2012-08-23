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
    'views/keyboard',
    'handlebars'
], function ($, _, BackboneExtension, BackboneValidation, Router, HeaderView, AlertsView, ShortcutsView, FooterView, KeyboardView, Handlebars) {
        var initialize = function () {

            Handlebars.registerHelper('photo_link', function (pictureUrl) {
                return App.Config.serverRootURL + pictureUrl;
            });

            // Define global singleton views
            App.Views.HeaderView = new HeaderView();
            $('.header').html(App.Views.HeaderView.render().el);
            App.Views.AlertsView = new AlertsView();
             $('.alerts').html(App.Views.AlertsView.render().el);
            App.Views.FooterView = new FooterView();
            $('footer').html(App.Views.FooterView.render().el);
            App.Views.ShortcutsView = new ShortcutsView($('.shortcuts-container'));
            App.Views.KeyboardView = new KeyboardView();

            // Pass in our Router module and call it's initialize function
            Router.initialize();
        };

        return {
            initialize:initialize
        };
    }
);