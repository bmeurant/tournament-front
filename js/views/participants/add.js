define([
    'jquery',
    'underscore',
    'backbone',
    'views/participants/edit'
], function($, _, Backbone, EditView) {

    return EditView.extend({
        viewType: 'add',

        initialize: function() {

            // call inherited constructor
            EditView.prototype.initialize.apply(this, arguments);
            this.events = _.extend({}, EditView.prototype.events, this.events);
            this.handlers = _.extend([], EditView.prototype.handlers, this.handlers);

        },

        afterSave: function() {

            // call inherited view behaviour
            EditView.prototype.afterSave.apply(this, arguments);

            // specific redirect
            Backbone.history.navigate('/participant/' + this.model.id + "/edit", true);
        }
    });
});