define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/view.html',
    'views/participants/navigation',
    'text!templates/participants/navigation.html',
    'views/participants/abstract',
    'pubsub'
], function ($, _, Backbone, Participant, participantViewTemplate, ParticipantNavigationView, participantNavigationTemplate, AbstractView, Pubsub) {

    var ParticipantView = AbstractView.extend({

        template:_.template(participantViewTemplate),
        navigationTemplate:_.template(participantNavigationTemplate),

        handlers: [],

        events:{

        },

        type: 'view',

        initialize:function (id) {
            AbstractView.prototype.initialize.apply(this, arguments);
            this.events = _.extend({}, AbstractView.prototype.events, this.events);
            this.handlers = _.extend([], AbstractView.prototype.handlers, this.handlers);
        }

    });

    return ParticipantView;
})
;