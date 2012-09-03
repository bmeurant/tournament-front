define([
    'jquery',
    'underscore',
    'backbone',
    'backbone-queryparams'
], function($, _, Backbone, BackboneQueryParams) {

    var AppRouter = Backbone.Router.extend({
        routes: {
            // Define some URL routes
            //':route/:action':'loadView',
            'participant/add': 'addParticipant',
            'participant/:id': 'showParticipant',
            'participant/:id/edit': 'editParticipant',
            'participants': 'listParticipants',
            'deletions': 'showDeletions',
            'help': 'showHelp',
            // Default
            '*path': 'defaultAction'
        },

        listParticipants: function(params) {
            require(['views/participants/paginatedList'],
                function(ParticipantListView) {
                    new ParticipantListView({root: '#content', params: params});
                });
        },

        showParticipant: function(id) {
            require(['views/participants/participant'],
                function(ParticipantView) {
                    new ParticipantView({root: '#content', id: id, type: 'details'});
                });
        },

        editParticipant: function(id) {
            require(['views/participants/participant'],
                function(ParticipantView) {
                    new ParticipantView({root: '#content', id: id, type: 'edit'});
                });
        },

        addParticipant: function() {
            require(['views/participants/add'],
                function(AddView) {
                    new AddView({root: '#content'});
                });
        },

        showDeletions: function() {
            require(['views/deletions/list'],
                function(DeletionsView) {
                    new DeletionsView({root: '#content'});
                });
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
        Backbone.history.start({pushState: true, root: '/'});

    };
    return {
        initialize: initialize
    };
});