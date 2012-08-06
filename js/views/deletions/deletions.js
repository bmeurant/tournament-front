define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/deletions/list.html',
    'views/deletions/abstract',
    'text!templates/participants/list.html',
    'models/participant',
    'pubsub'
], function ($, _, Backbone, Handlebars, deletionsTemplate, AbstractView, participantTemplate, Participant, Pubsub) {

    /**
     * Main view for displaying deletions
     */
    var DeletionsView = AbstractView.extend({

        template:Handlebars.compile(deletionsTemplate),
        participantsTemplate:Handlebars.compile(participantTemplate),

        handlers:[],

        events:{
            "click #deletions-container li.thumbnail":"cancelElementDeletion"
        },

        modelsCollection:{},

        initialize:function () {

            // call inherited constructor
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

            Handlebars.registerHelper('unless_deleted', function (id, options) {
                if (true) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });

            Handlebars.registerHelper('selected', function (id) {
                return "";
            });
        },

        /**
         * Creates an empty models collection with the correct format
         */
        emptyModelsCollection:function () {
            this.modelsCollection.participant = [];
        },

        /**
         * Remove a given element from the list of elements to delete and from the current view
         *
         * @param type type of the current element
         * @param id id of the current element
         */
        deleteElem:function (type, id) {
            this.initCollection();
            this.addToCollection(type, id);
            this.storeInLocalStorage();
            Pubsub.publish(Events.ELEM_DELETED_FROM_VIEW, [id, type]);
        },

        /**
         * Populate and initialize properly instance collections in order to prepare rendering.
         * This methods retrieve the elements id deletion list from local storage and build
         * a new collection made of corresponding elements models from fetching server.
         *
         * @param callback function to call after population completion
         */
        populateCollection:function (callback) {
            // Store the number of callbacks that are wainting to be called in order to be
            // able to perform an unique action after population and fetching all elements
            // and not only after fetching each one : due to asynchronous call
            var nbWaintingCallbacks = 0;
            var self = this;

            // if collection is empty, don't do anything but rendering view
            if (utils.mapLength(this.collection) == 0) {
                this.showTemplate();
                callback();
            }
            else {
                $.each(this.collection, function (elemType, idArray) {
                    $.each(idArray, function (index, id) {

                        var currentModel;
                        var errorsCount = 0;

                        // Build new empty model from the given type
                        switch (elemType) {
                            case 'participant':
                                currentModel = new Participant;
                        }

                        currentModel.id = id;

                        // expecting new callback to be called
                        nbWaintingCallbacks += 1;

                        // Retrieve object from server
                        currentModel.fetch({
                            success:function (model) {
                                // one callback called
                                nbWaintingCallbacks -= 1;

                                // add model to current collection and call callback
                                self.addToModelsCollection(elemType, model);
                                self.afterPopulate(nbWaintingCallbacks, callback, errorsCount);
                            },
                            error:function (model, response) {
                                if (response.status == 404) {
                                    self.collection[elemType].splice(index, 1);
                                }
                                // one callback called
                                nbWaintingCallbacks -= 1;

                                // add error and call callback
                                errorsCount += 1;
                                self.afterPopulate(nbWaintingCallbacks, callback, errorsCount);
                            }
                        });
                    });
                });
            }
        },

        /**
         * Render a collection of model objects of a given type to JSON
         *
         * @param collection collection to render
         * @param type element object type filter
         * @return {*} a JSON representation of the type sub collection of this collection
         */
        collectionToJSON:function (collection, type) {
            return collection[type].map(function (model) {
                return model.toJSON();
            });
        },

        /**
         * Method called after any fetch operation from populate.
         * Display global operation result (successes or errors) if only there is no more callback to call
         *
         * @param nbWaintingCallbacks number of callbacks still waiting to be called
         * @param callback final callback to be called
         * @param errorsCount number of current stored errors
         */
        afterPopulate:function (nbWaintingCallbacks, callback, errorsCount) {

            // if there is no more callback yo call
            if (nbWaintingCallbacks == 0) {
                this.storeInLocalStorage();

                // if the number of errors is strictly equal to the number of elements to fetch
                if (errorsCount == this.countElements(this.collection)) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Some participants could not be retrived', 'alert-warning']);
                }
                // there is at least on error
                else if (errorsCount > 0) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                }

                if (callback != null)
                    callback();

                Pubsub.publish(Events.DELETIONS_POPULATED);
            }
        },

        /**
         * Add a given element to the current model collection if not already contained
         *
         * @param type type of the element to add
         * @param model element to add
         */
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
            var participants_template = this.participantsTemplate({'participants':this.collectionToJSON(this.modelsCollection, 'participant')});
            this.$el.html(this.template({'participants':this.collectionToJSON(this.modelsCollection, 'participant'), 'participants_template':new Handlebars.SafeString(participants_template)}));
        },

        /**
         * Cancel element deletion by removing it from current deletions collection and from the current view
         * (example: on an element click)
         *
         * @param event event raised if any
         */
        cancelElementDeletion:function (event) {
            event.stopPropagation();
            event.preventDefault();
            var idElem = event.currentTarget.getAttribute("id");

            // get collection from local storage
            this.initCollection();

            // find and remove the element from the deletions collection
            var self = this;
            $.each(this.collection, function (type, idArray) {
                $.each(idArray, function (index, id) {
                    if (id == idElem) {
                        self.collection[type].splice(index, 1);
                        return false;
                    }
                });
            });

            // remove element from the current view
            $("#" + idElem).remove();

            // save changes in local storage and refresh view
            this.storeInLocalStorage();
            this.render();

            Pubsub.publish(Events.DELETION_CANCELED);
        }

    });

    return DeletionsView;
});