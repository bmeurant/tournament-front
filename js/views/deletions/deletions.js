define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/deletions/list.html',
    'views/deletions/abstract',
    'text!templates/participants/list.html',
    'models/participant',
    'pubsub'
], function ($, _, Backbone, deletionsTemplate, AbstractView, participantTemplate, Participant, Pubsub) {
    var DeletionsView = AbstractView.extend({

        template:_.template(deletionsTemplate),
        participantsTemplate:_.template(participantTemplate),

        handlers:[],

        events:{
            "click #deletions-container li.thumbnail":"cancelElementDeletion"
        },

        modelsCollection:{},

        initialize:function () {

            // merge members of inherited abstract class with 'this'
            AbstractView.prototype.initialize.apply(this, arguments);
            this.events = _.extend({}, AbstractView.prototype.events, this.events);
            this.handlers = _.extend([], AbstractView.prototype.handlers, this.handlers);

            // override this.el because of abstract inheritance
            this.$el = $("<div>").attr("id", "deletions-container");
            this.el = this.$el.get(0);

            // init PubSub bindings
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM_FROM_VIEW, this.deleteElem.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CONFIRMED, this.render.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CANCELED, this.render.bind(this)));

            this.emptyModelsCollection();
        },

        emptyModelsCollection:function () {
            this.modelsCollection.participant = [];
        },

        deleteElem:function (id, type) {
            this.initCollection();
            this.addToCollection(type, id);
            this.storeInLocalStorage();
            Pubsub.publish(Events.ELEM_DELETED_FROM_VIEW, [id, type]);
        },

        populateCollection:function (callback) {
            var nbWaintingCallbacks = 0;
            var self = this;
            if (utils.mapLength(this.collection) == 0) {
                this.showTemplate();
                callback();
            }
            else {
                $.each(this.collection, function (elemType, idArray) {
                    $.each(idArray, function (index, id) {

                        var currentModel;
                        var errorsCount = 0;

                        switch (elemType) {
                            case 'participant':
                                currentModel = new Participant;
                        }

                        currentModel.id = id;

                        nbWaintingCallbacks += 1;
                        currentModel.fetch({
                            success:function (model) {
                                nbWaintingCallbacks -= 1;
                                self.addToModelsCollection(elemType, model);
                                self.afterPopulate(nbWaintingCallbacks, callback, errorsCount);
                            },
                            error:function (model, response) {
                                if (response.status == 404) {
                                    self.collection[elemType].splice(index, 1);
                                }
                                nbWaintingCallbacks -= 1;
                                errorsCount += 1;
                                self.afterPopulate(nbWaintingCallbacks, callback, errorsCount);
                            }
                        });
                    });
                });
            }
        },

        collectionToJSON:function (collection, type) {
            return collection[type].map(function (model) {
                return model.toJSON();
            });
        },

        afterPopulate:function (nbWaintingCallbacks, callback, errorsCount) {
            if (nbWaintingCallbacks == 0) {
                this.storeInLocalStorage();

                if (errorsCount == this.countElements(this.collection)) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Some participants could not be retrived', 'alert-warning']);
                }
                else if (errorsCount > 0) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                }

                if (callback != null)
                    callback();
                Pubsub.publish(Events.DELETIONS_POPULATED);
            }
        },

        addToModelsCollection:function (type, model) {
            if (this.modelsCollection[type].indexOf(model) < 0) {
                this.modelsCollection[type].push(model);
            }
        },

        render:function () {
            this.initCollection();
            this.emptyModelsCollection();
            this.populateCollection(this.showTemplate.bind(this));
            Pubsub.publish(Events.VIEW_CHANGED, ['deletions']);
            return this;
        },

        showTemplate:function () {
            this.$el.html(this.template({'participants':this.collectionToJSON(this.modelsCollection, 'participant'), server_url:'http://localhost:3000/api', 'deleted':[], 'id_selected':'no', 'participants_template':this.participantsTemplate}));
        },

        cancelElementDeletion:function (event) {
            event.stopPropagation();
            event.preventDefault();
            var idElem = event.currentTarget.getAttribute("id");

            this.initCollection();
            var self = this;
            $.each(this.collection, function (type, idArray) {
                $.each(idArray, function (index, id) {
                    if (id == idElem) {
                        self.collection[type].splice(index, 1);
                        return false;
                    }
                });
            });

            $("#" + idElem).remove();
            this.storeInLocalStorage();
            this.render();
            Pubsub.publish(Events.DELETION_CANCELED);
        }

    });

    return DeletionsView;
});