define([
    'jquery',
    'underscore',
    'backbone',
    'views/participants/edit'
], function ($, _, Backbone, EditView) {

    var AddView = EditView.extend({
        type:'add'
    });

    return AddView;
});