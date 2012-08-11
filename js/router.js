define([
    'jquery',
    'underscore',
    'backbone',
    'backbone-queryparams',
    'views/participants/list',
    'views/participants/participant',
    'views/deletions/deletions'
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
            utils.showView($('#content'), ParticipantListView, [params]);
        },

        showParticipant:function (id) {
            utils.showView($('#content'), ParticipantView, [id, 'details']);
        },

        editParticipant:function (id) {
            utils.showView($('#content'), ParticipantView, [id, 'edit']);
        },

        addParticipant:function () {
            utils.showView($('#content'), ParticipantView, [null, 'add']);
        },

        showDeletions:function () {
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

            var href = this.href;
            var protocol = this.protocol + '//';
            href = href.slice(protocol.length);
            href = href.slice(href.indexOf("/") + 1 );

            if (href.slice(protocol.length) !== protocol) {
                evt.preventDefault();
                Backbone.history.navigate(href, true);
            }
        });
    };
    return {
        initialize:initialize
    };
})
;