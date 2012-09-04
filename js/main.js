// Require.js allows us to configure shortcut alias
// Their usage will become more apparent further along in the tutorial.
require.config({

    shim: {
        'underscore': {
            exports: '_'
        },
        'underscore.string': {
            deps: [
                'underscore'
            ]
        },
        'handlebars': {
            exports: 'Handlebars'
        },
        'backbone-orig': {
            deps: [
                'underscore',
                'underscore.string',
                'jquery'
            ],
            exports: 'Backbone'
        },
        'backbone-queryparams': {
            deps: [
                'backbone-orig',
                'underscore'
            ]
        },
        'backbone-paginator': {
            deps: [
                'backbone-orig',
                'underscore',
                'jquery'
            ],
            exports: 'Backbone.Paginator'
        },
        async: {
            deps: [
                'underscore'
            ]
        }
    },

    paths: {
        jquery: 'libs/jquery',
        underscore: 'libs/underscore',
        'underscore.string': 'libs/underscore.string',
        'backbone-orig': 'libs/backbone',
        backbone: 'resthub/backbone.ext',
        localstorage: 'libs/localstorage',
        text: 'libs/text',
        i18n: 'libs/i18n',
        pubsub: 'resthub/pubsub',
        'bootstrap': 'libs/bootstrap',
        'backbone-validation': 'libs/backbone-validation',
        'resthub-backbone-validation': 'resthub/backbone-validation.ext',
        handlebars: 'libs/handlebars',
        'resthub-handlebars': 'resthub/handlebars-helpers',
        'backbone-queryparams': 'libs/backbone.queryparams',
        'backbone-paginator': 'libs/backbone.paginator',
        async: 'libs/async',
        keymaster: 'libs/keymaster',
        hbs: 'resthub/handlebars-require',
        templates: '/templates'
    }

});

// namespaces for Singleton views and routers
App = {
    Routers: {},
    Views: {}
};


require([

    // Load our app module and pass it to our definition function
    'jquery',
    'resthub-handlebars',
    'routers/router',
    'views/header',
    'views/alerts',
    'views/help/shortcuts',
    'views/footer',
    'views/keyboard',
    'events',
    'config'
    // Some plugins have to be loaded in order due to their non AMD compliance
    // Because these scripts are not 'modules' they do not pass any values to the definition function below
], function($, Handlebars, Router, HeaderView, AlertsView, ShortcutsView, FooterView, KeyboardView) {

    Handlebars.registerHelper('photo_link', function(pictureUrl) {
        return App.Config.serverRootURL + pictureUrl;
    });

    // Define global singleton views
    App.Views.HeaderView = new HeaderView({root: $('.header')});
    App.Views.AlertsView = new AlertsView({root: $('.alerts')});
    App.Views.FooterView = new FooterView({root: $('footer')});
    App.Views.ShortcutsView = new ShortcutsView({root: $('.shortcuts-container')});
    App.Views.KeyboardView = new KeyboardView();

    // Pass in our Router module and call it's initialize function
    Router.initialize();
});