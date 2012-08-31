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
                    var view = new ParticipantListView({params: params});
                    $('#content').html(view.el);
                });
        },

        showParticipant: function(id) {
            require(['views/participants/participant'],
                function(ParticipantView) {
                    var view = new ParticipantView({id: id, type: 'details'});
                    $('#content').html(view.el);
                });
        },

        editParticipant: function(id) {
            require(['views/participants/participant'],
                function(ParticipantView) {
                    var view = new ParticipantView({id: id, type: 'edit'});
                    $('#content').html(view.el);
                });
        },

        addParticipant: function() {
            require(['views/participants/add'],
                function(AddView) {
                    var view = new AddView();
                    $('#content').html(view.el);
                });
        },

        showDeletions: function() {
            require(['views/deletions/list'],
                function(DeletionsView) {
                    var view = new DeletionsView();
                    $('#content').html(view.el);
                });
        },

        showHelp: function() {
            require(['views/help/help'],
                function(HelpView) {
                    var view = new HelpView();
                    $('#content').html(view.el);
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