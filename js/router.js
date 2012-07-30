define([
    'jquery',
    'underscore',
    'backbone',
    'views/participants/list',
    'views/participants/view',
    'views/participants/edit',
    'views/participants/add',
    'views/participants/menu',
    'pubsub'
], function ($, _, Backbone, ParticipantListView, ParticipantView, ParticipantEditView, ParticipantAddView,ParticipantsMenuView, Pubsub) {

    Backbone.View.prototype.close = function () {
        console.log('Closing view ' + this);
        if (this.beforeClose) {
            this.beforeClose();
        }
        if (this.handlers) {
            $.each(this.handlers, function (index, value) {
                Pubsub.unsubscribe(value);
            });
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
            utils.showView($('#content'), new ParticipantView(id));
        },

        editParticipant:function (id) {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), new ParticipantEditView(id));
        },

        addParticipant:function () {
            classes.Views.HeaderView.setMenu(ParticipantsMenuView);
            classes.Views.HeaderView.selectMenuItem('element-menu');
            utils.showView($('#content'), new ParticipantAddView());
        },

        showDeletions:function () {
            classes.Views.currentView.close();
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