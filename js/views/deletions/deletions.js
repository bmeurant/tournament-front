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
    return AbstractView.extend({

            template:Handlebars.compile(deletionsTemplate),
            participantsTemplate:Handlebars.compile(participantTemplate),

            handlers:[],

            events:{
                "click #deletions-container li.thumbnail":"cancelElementDeletion"
            },

            JSONCollection:{},

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

                this.emptyJSONCollection();

                Handlebars.registerHelper('if_deleted', function () {
                    return false;
                });

                Handlebars.registerHelper('disabled', function () {
                    return '';
                });

                Handlebars.registerHelper('selected', function (id) {
                    return (this.idSelected && this.idSelected == id) ? "selected" : "";
                }.bind(this));

            },

            /**
             * Creates an empty models collection with the correct format
             */
            emptyJSONCollection:function () {
                this.JSONCollection.participant = [];
            },

            /**
             * Populate and initialize properly instance collections in order to prepare rendering.
             */
            populateCollection:function () {

                // if collection is empty, don't do anything but rendering view
                if (this.countElements(this.collection) == 0) {
                    this.showTemplate();
                }
                else {
                    var elements = [];
                    $.each(this.collection, function (elemType, idArray) {
                        $.each(idArray, function (index, id) {
                            elements.push({type:elemType, id:id, index:index});

                        }.bind(this));
                    }.bind(this));

                    async.map(elements, this.fetchElement.bind(this), this.afterPopulate.bind(this));
                }
            },

            fetchElement:function (elem, fetchCallback) {
                $.getJSON('http://localhost:3000/api/' + elem.type + '/' + elem.id)
                .done(function (data) {
                    // add model to current collection and call callback
                    this.JSONCollection[elem.type].push(data);
                    fetchCallback(null, elem);
                }.bind(this))
                .fail(function (jqXHR) {
                    if (jqXHR.status == 404) {
                        // element obviously already deleted from server. Ignore it and remove from local collection
                        this.collection[elem.type].splice(elem.index, 1);
                    }

                    // callback is called with null error parameter because otherwise it breaks the
                    // loop and top on first error :-(
                    fetchCallback(null, null);
                }.bind(this));
            },

            /**
             * Method called after all fetch operations from populate.
             * Display global operation result (successes or errors)
             *
             * @param err always null because default behaviour break map on first error
             * @param results array of fetched models : contain null value in cas of error
             */
            afterPopulate:function (err, results) {

                this.storeInLocalStorage();

                // remove null elements i.e. models that could not be fetched
                var successes = results.filter(function (e) {
                    return e;
                });

                // if the number of errors is strictly equal to the number of elements to fetch
                if (successes.length == 0) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                }
                // there is at least on error
                else if (successes.length < this.countElements(this.collection)) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Some participants could not be retrieved', 'alert-warning']);
                }

                this.showTemplate();

                Pubsub.publish(Events.DELETIONS_POPULATED);
            },

            render:function () {
                this.initCollection();
                this.emptyJSONCollection();
                this.populateCollection();

                Pubsub.publish(Events.VIEW_CHANGED, ['deletions', 'deletions']);
                return this;
            },

            showTemplate:function () {
                var participants_template = this.participantsTemplate({'participants':this.JSONCollection['participant']});
                this.$el.html(this.template({'participants':this.JSONCollection['participant'], 'participants_template':new Handlebars.SafeString(participants_template)}));

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

                this.cancelDeletion(idElem);
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
             * @param idElem id of the element to delete
             */
            cancelDeletion:function (idElem) {
                // get collection from local storage
                this.initCollection();

                // find and remove the element from the deletions collection
                $.each(this.collection, function (type, idArray) {
                    $.each(idArray, function (index, id) {
                        if (id == idElem) {
                            this.collection[type].splice(index, 1);
                            return false;
                        }
                    }.bind(this));
                }.bind(this));

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

        });
});