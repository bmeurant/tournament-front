define([
    'jquery',
    'underscore',
    'backbone',
    'backbone-paginator',
    'models/participant'
], function ($, _, Backbone, BackbonePaginator, participantModel) {

    /**
     * Collection of Participant model objects
     */
    return Backbone.Paginator.requestPager.extend({

        model:participantModel,
        paginator_core:{
            // the type of the request (GET by default)
            type:'GET',

            // the type of reply (jsonp by default)
            dataType:'json',

            // the URL (or base URL) for the service
            url:App.Config.serverRootURL + '/participant'
        },
        paginator_ui:{
            // the lowest page index your API allows to be accessed
            firstPage:1,

            // which page should the paginator start from
            // (also, the actual page the paginator is on)
            currentPage:1,

            // how many items per page should be shown
            perPage:12,

            // a default number of total pages to query in case the API or
            // service you are using does not support providing the total
            // number of pages for us.
            // 10 as a default in case your service doesn't return the total
            totalPages:10
        },
        server_api:{
            'page':function () {
                return this.currentPage;
            },

            'perPage':function () {
                return this.perPage;
            }

        },
        parse:function (response) {
            var participants = response.content;
            this.totalPages = response.totalPages;
            this.totalRecords = response.totalElements;
            this.lastPage = this.totalPages;
            return participants;
        }
    });
});