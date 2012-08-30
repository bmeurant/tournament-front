define([
    'underscore',
    'backbone',
    'models/participant',
    'views/participants/edit',
    'pubsub'
], function(_, Backbone, Participant, EditView, Pubsub) {

    return EditView.extend({
        viewType: 'add',

        initialize: function() {
            // merge events
            this.events = _.extend({}, EditView.prototype.events, this.events);

            this.model = new Participant();

            // call inherited initializer
            EditView.prototype.initialize.apply(this, arguments);

            this.render();
        },

        afterSave: function() {
            // call inherited view behaviour
            EditView.prototype.afterSave.apply(this, arguments);

            // specific redirect
            Backbone.history.navigate('/participant/' + this.model.id + '/edit', true);
        },

        render: function () {
            EditView.prototype.render.apply(this, arguments);
            Pubsub.trigger(App.Events.VIEW_CHANGED, this.elemType, this.viewType);
            return this;
        }
    });
});