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
        'backbone-queryparams':'libs/backbone.queryparams',
        'bootstrap':'libs/bootstrap',
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
    'app',
    'backbone',
    'handlebars',
    'handlebars-helpers',
    'async',
    'events',
    'config'
    // Some plugins have to be loaded in order due to their non AMD compliance
    // Because these scripts are not "modules" they do not pass any values to the definition function below
], function (App) {

    // The "app" dependency is passed in as "App"
    // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
    App.initialize();
});