// Require.js allows us to configure shortcut alias
// Their usage will become more apparent further along in the tutorial.
require.config({

    shim:{
        'underscore':{
            exports:'_'
        },
        'underscore.string':{
            deps:[
                'underscore'
            ],
            exports:'_s'
        },
        'handlebars':{
            exports:'Handlebars'
        },
        'backbone':{
            deps:[
                'underscore',
                'underscore.string',
                'jquery'
            ],
            exports:'Backbone'
        },
        'backbone-paginator':{
            deps:[
                'backbone',
                'underscore',
                'jquery'
            ],
            exports:'Backbone.Paginator'
        }
    },

    paths:{
        jquery:'libs/jquery',
        underscore:'libs/underscore',
        'underscore.string':"libs/underscore.string",
        backbone:'libs/backbone',
        'backbone.ext':'libs/extensions/backbone.ext',
        'backbone-validation':'resthub/backbone-validation.ext',
        'backbone-paginator':'libs/backbone.paginator',
        'bootstrap':'libs/bootstrap',
        'backbone-queryparams':'libs/backbone.queryparams',
        use:"libs/use",
        async:"libs/async",
        pubsub:'resthub/pubsub',
        localstorage:"libs/localstorage",
        text:"libs/text",
        i18n:"libs/i18n",
        templates:"/templates",
        handlebars:"libs/handlebars",
        'handlebars-helpers':"resthub/handlebars-helpers",
        keymaster:"libs/keymaster"
    }

})
;

// namespaces for Singleton views and routers
App = {
    Routers:{},
    Views:{}
};


require([

    // Load our app module and pass it to our definition function
    'jquery',
    'backbone.ext',
    'handlebars',
    'router',
    'views/header',
    'views/alerts',
    'views/help/shortcuts',
    'views/footer',
    'views/keyboard',
    'handlebars-helpers',
    'async',
    'events',
    'config'
    // Some plugins have to be loaded in order due to their non AMD compliance
    // Because these scripts are not "modules" they do not pass any values to the definition function below
], function ($, BackboneExtension, Handlebars, Router, HeaderView, AlertsView, ShortcutsView, FooterView, KeyboardView) {

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
});