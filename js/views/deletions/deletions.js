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
                this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CONFIRMED, this.render.bind(this)));
                this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CANCELED, this.render.bind(this)));
                this.handlers.push(Pubsub.subscribe(Events.NEXT_CALLED, this.selectNext.bind(this)));
                this.handlers.push(Pubsub.subscribe(Events.PREVIOUS_CALLED, this.selectPrevious.bind(this)));
                this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM, this.cancelSelectedDeletion.bind(this)));

                this.emptyModelsCollection();

                Handlebars.registerHelper('if_deleted', function (id, options) {
                    return false;
                });

                Handlebars.registerHelper('disabled', function (id) {
                    return '';
                });

                var self = this;

                Handlebars.registerHelper('selected', function (id) {
                    return (self.idSelected && self.idSelected == id) ? "selected" : "";
                });

            },

            /**
             * Creates an empty models collection with the correct format
             */
            emptyModelsCollection:function () {
                this.modelsCollection.participant = [];
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
                }
                else {
                    var models = [];
                    $.each(this.collection, function (elemType, idArray) {
                        $.each(idArray, function (index, id) {
                            var currentModel;

                            // Build new empty model from the given type
                            switch (elemType) {
                                case 'participant':
                                    currentModel = new Participant;
                            }

                            currentModel.id = id;

                            models.push({type:elemType, model:currentModel, index:index});

                        }.bind(this));
                    }.bind(this));

                    async.map(models, this.fetchModel.bind(this), this.afterPopulate.bind(this));
                }
            },

            fetchModel:function (elem, fetchCallback) {
                elem.model.fetch({
                    success:function (newModel) {

                        // add model to current collection and call callback
                        this.addToModelsCollection(elem.type, elem.model);
                        fetchCallback(null, newModel);
                    }.bind(this),
                    error:function (newModel, response) {
                        if (response.status == 404) {
                            // elemnt obviously already deleted from server. Ignore it and remove from local collection
                            this.collection[elem.type].splice(elem.index, 1);
                        }

                        fetchCallback(null, null);
                    }.bind(this)
                });
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
            afterPopulate:function (err, result) {

                    this.storeInLocalStorage();

                    result = result.filter(function(e){return e});

                    // if the number of errors is strictly equal to the number of elements to fetch
                    if (result.length == 0) {
                        Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                    }
                    // there is at least on error
                    else if (result.length < this.countElements(this.collection)) {
                        Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Some participants could not be retrived', 'alert-warning']);
                    }

                    this.showTemplate();

                    Pubsub.publish(Events.DELETIONS_POPULATED);
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
                this.populateCollection();

                Pubsub.publish(Events.VIEW_CHANGED, ['deletions']);
                return this;
            },

            showTemplate:function () {
                var participants_template = this.participantsTemplate({'participants':this.collectionToJSON(this.modelsCollection, 'participant')});
                this.$el.html(this.template({'participants':this.collectionToJSON(this.modelsCollection, 'participant'), 'participants_template':new Handlebars.SafeString(participants_template)}));

                // if no element is currently select, select the first one
                var $selected = utils.findSelected(this.$el, "li.thumbnail");
                if (!$selected || $selected.length == 0) {
                    utils.selectFirst(this.$el, "li.thumbnail");
                }
            },

            /**
             * Cancel deletion of the current element
             *
             * @param event event raised if any
             */
            cancelElementDeletion:function (event) {
                event.stopPropagation();
                event.preventDefault();
                var idElem = event.currentTarget.getAttribute("id");

                this.cancelDeletion(id);
            },

            /**
             * Cancel deletion of the selected element
             */
            cancelSelectedDeletion:function () {

                var $selected = utils.findSelected(this.$el, "li.thumbnail");
                if ($selected && $selected.length > 0) {
                    this.cancelDeletion($selected.attr("id"));
                }
            },

            /**
             * Cancel element deletion by removing it from current deletions collection and from the current view
             *
             * @param id id of the element to delete
             */
            cancelDeletion:function (idElem) {
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

                // retrieve and save the currently selected element, if any
                var $selected = utils.findSelected(this.$el, "li.thumbnail");

                if ($selected && $selected.length > 0) {
                    this.idSelected = utils.findSelected(this.$el, "li.thumbnail").get(0).id;
                }

                // remove element from the current view
                $("#" + idElem).remove();

                // save changes in local storage and refresh view
                this.storeInLocalStorage();
                this.render();

                Pubsub.publish(Events.DELETION_CANCELED);
            },

            selectNext:function () {
                utils.selectElement(this.$el, "li.thumbnail", "next");
            },

            selectPrevious:function () {
                utils.selectElement(this.$el, "li.thumbnail", "previous");
            }

        })
        ;

    return DeletionsView;
})
;