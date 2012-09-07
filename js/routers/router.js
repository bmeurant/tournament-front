define([
    'jquery',
    'underscore',
    'backbone',
    'routers/participants',
    'backbone-queryparams'
], function($, _, Backbone, ParticipantsRouter) {

    var AppRouter = Backbone.Router.extend({
        routes: {
            'fr/*path': 'fr',
            'en/*path': 'en',
            'help': 'showHelp',
            // Default
            '': 'defaultAction'
        },

        fr: function(path) {
            var locale = localStorage.getItem('locale');
            if (locale != 'fr-fr') {
                localStorage.setItem('locale', 'fr-fr');
                // i18n plugin require page reload !
                location.reload();
            }
            Backbone.history.stop();
            Backbone.history.start({pushState: true, root: '/fr'});
            this.navigate(path, true);
        },

        en: function(path) {
            var locale = localStorage.getItem('locale');
            if (locale != 'en-us') {
                localStorage.setItem('locale', 'en-us');
                // i18n plugin require page reload !
                location.reload();
            }
            Backbone.history.stop();
            Backbone.history.start({pushState: true, root: '/en'});
            this.navigate(path, true);
        },

        showHelp: function() {
            require(['views/help/help'],
                function(HelpView) {
                    new HelpView({root: '#content'});
                });
        },

        defaultAction: function() {
            this.navigate('participants', true);
        }
    });

    var initialize = function() {
        App.Routers.AppRouter = new AppRouter;
        App.Routers.ParticipantsRouter = new ParticipantsRouter;
        Backbone.history.start({pushState: true, root: '/'});

    };
    return {
        initialize: initialize
    };
});