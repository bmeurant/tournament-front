define([
    'jquery',
    'underscore',
    'backbone',
    'views/participants/list',
    'views/participants/participant',
    'views/participants/menu',
    'pubsub'
], function ($, _, Backbone, ParticipantListView, ParticipantView, ParticipantsMenuView, Pubsub) {

    Backbone.View.prototype.close = function () {
        if (this.beforeClose) {
            this.beforeClose();
        }
        this.remove();
        this.unbind();
    };

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
            utils.showView($('#content'), new ParticipantListView());
        },

        showParticipant:function (id) {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), new ParticipantView(id, 'details'))
        },

        editParticipant:function (id) {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), new ParticipantView(id, 'edit'))
        },

        addParticipant:function () {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), new ParticipantView(null, 'add'))
        },

        showDeletions:function () {
            if (classes.Views.currentView) {
                classes.Views.currentView.close();
            }
            classes.Views.HeaderView.clearMenu();
            classes.Views.HeaderView.selectMenuItem('delete-menu');
            classes.Views.DeletionsView.render();
        },

        defaultAction:function (actions) {
            this.navigate("participants", true);
        }

    });

    var initialize = function () {
        classes.Routers.AppRouter = new AppRouter;
        Backbone.history.start();
    };
    return {
        initialize:initialize
    };
});