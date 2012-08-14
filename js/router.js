define([
    'jquery',
    'underscore',
    'backbone',
    'backbone-queryparams',
    'views/participants/list',
    'views/participants/participant',
    'views/deletions/list'
], function ($, _, Backbone, BackboneQueryParams, ParticipantListView, ParticipantView, DeletionsView) {

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

        listParticipants:function (params) {
            this.showView($('#content'), ParticipantListView, [params]);
        },

        showParticipant:function (id) {
            this.showView($('#content'), ParticipantView, [id, 'details']);
        },

        editParticipant:function (id) {
            this.showView($('#content'), ParticipantView, [id, 'edit']);
        },

        addParticipant:function () {
            this.showView($('#content'), ParticipantView, [null, 'add']);
        },

        showDeletions:function () {
            this.showView($('#content'), DeletionsView, []);
        },

        defaultAction:function () {
            this.navigate("participants", true);
        },

        /**
         * This methods wrap initialization and rendering of main view in order to guarantee
         * that any previous main view is properly closed and unbind.
         *
         * Otherwise events and listeners are raise twice or more and the application becomes unstable
         *
         * @param $selector jquery selector in which the view has to be rendered
         * @param View View to create
         * @param args optional view constructor arguments
         * @return {Object} created View
         */
        showView:function ($selector, View, args) {
            // initialize args if null
            args = args || [];

            // clean previous view
            if (App.Views.currentView) {
                App.Views.currentView.close();
            }

            // insertion of this in arguments in order to perform dynamic constructor call
            args.splice(0, 0, this);

            // call constructor and initialize view
            var view = new (Function.prototype.bind.apply(View, args));

            // render view
            $selector.html(view.render().el);

            // replace global accessor of current view
            App.Views.currentView = view;

            return view;
        }
    });

    var initialize = function () {
        App.Routers.AppRouter = new AppRouter;
        Backbone.history.start({pushState:true, root:"/"});

    };
    return {
        initialize:initialize
    };
})
;