define([
    'jquery',
    'underscore',
    'backbone',
    'routers/participants',
    'backbone-queryparams'
], function($, _, Backbone, ParticipantsRouter) {

    var AppRouter = Backbone.Router.extend({
        routes: {
            'help': 'showHelp',
            // Default
            '*path': 'defaultAction'
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