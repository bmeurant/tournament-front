define([
    'jquery',
    'underscore',
    'backbone',
    'views/participants/list',
    'views/participants/participant',
    'views/participants/menu',
    'views/deletions/deletions'
], function ($, _, Backbone, ParticipantListView, ParticipantView, ParticipantsMenuView, DeletionsView) {

    var AppRouter = Backbone.Router.extend({
        routes:{
            // Define some URL routes
            //":route/:action":"loadView",
            "participant/add":"addParticipant",
            "participant/:id":"showParticipant",
            "participant/:id/edit":"editParticipant",
            "participants":"listParticipants",
            "deletions":"showDeletions",
            // Default
            '*path':'defaultAction'
        },

        listParticipants:function () {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), ParticipantListView);
        },

        showParticipant:function (id) {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), ParticipantView, [id, 'details']);
        },

        editParticipant:function (id) {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), ParticipantView, [id, 'edit']);
        },

        addParticipant:function () {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), ParticipantView, [null, 'add']);
        },

        showDeletions:function () {
            if (classes.Views.currentView) {
                classes.Views.currentView.close();
            }
            classes.Views.HeaderView.clearMenu();
            classes.Views.HeaderView.selectMenuItem('delete-menu');
            utils.showView($('#content'), DeletionsView, []);
        },

        defaultAction:function () {
            this.navigate("participants", true);
        }

    });

    var initialize = function () {
        classes.Routers.AppRouter = new AppRouter;
        Backbone.history.start({pushState:true, root:"/"});

        // force all links to be handled by Backbone pushstate - no get will be send to server
        $(document).on('click', 'a:not([data-bypass])', function (evt) {

            var href = $(this).attr('href');
            var protocol = this.protocol + '//';

            if (href.slice(protocol.length) !== protocol) {
                evt.preventDefault();
                Backbone.history.navigate(href, true);
            }
        });
    };
    return {
        initialize:initialize
    };
});