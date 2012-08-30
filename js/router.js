define([
    'jquery',
    'underscore',
    'backbone',
    'backbone-queryparams',
    'views/participants/paginatedList',
    'views/participants/participant',
    'views/deletions/list',
    'views/help/help'
], function($, _, Backbone, BackboneQueryParams, ParticipantListView, ParticipantView, DeletionsView, HelpView) {

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
            var view = new ParticipantListView({params: params});
            $('#content').html(view.el);
        },

        showParticipant: function(id) {
            var view = new ParticipantView({id: id, type: 'details'});
            $('#content').html(view.render().el);
        },

        editParticipant: function(id) {
            var view = new ParticipantView({id: id, type: 'edit'});
            $('#content').html(view.render().el);
        },

        addParticipant: function() {
            var view = new ParticipantView({id: null, type: 'add'});
            $('#content').html(view.render().el);
        },

        showDeletions: function() {
            var view = new DeletionsView();
            $('#content').html(view.render().el);
        },

        showHelp: function() {
            var view = new HelpView();
            $('#content').html(view.render().el);
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