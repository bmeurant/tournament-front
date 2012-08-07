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
    /*var participantsCollection = Backbone.Collection.extend({
     model:participantModel,
     url:"http://localhost:3000/api/participants",

     initialize:function () {

     }

     });*/

    var participantsCollection = Backbone.Paginator.clientPager.extend({

        model:participantModel,
        paginator_core:{
            // the type of the request (GET by default)
            type:'GET',

            // the type of reply (jsonp by default)
            dataType:'json',

            // the URL (or base URL) for the service
            url:'http://localhost:3000/api/participants'
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
        parse:function (response) {
            return response;
        }
    });


    return new participantsCollection;
});