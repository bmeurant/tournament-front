define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'text!templates/deletions/list.html',
    'views/deletions/abstract',
    'text!templates/participants/list.html',
    'models/participant',
    'mixins/selectable',
    'pubsub'
], function ($, _, Backbone, Handlebars, deletionsTemplate, AbstractView, participantTemplate, Participant, Selectable, Pubsub) {

    /**
     * Main view for displaying deletions
     */
    return AbstractView.extend(
        _.extend({}, Selectable, {

            template:Handlebars.compile(deletionsTemplate),
            participantsTemplate:Handlebars.compile(participantTemplate),

            handlers:[],
            elemType:'deletions',
            viewType:'list',

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
                this.handlers.push(Pubsub.subscribe(App.Events.DELETIONS_CONFIRMED, this.render.bind(this)));
                this.handlers.push(Pubsub.subscribe(App.Events.DELETIONS_CANCELED, this.render.bind(this)));
                this.handlers.push(Pubsub.subscribe(App.Events.NEXT_CALLED, this.selectNext.bind(this)));
                this.handlers.push(Pubsub.subscribe(App.Events.PREVIOUS_CALLED, this.selectPrevious.bind(this)));
                this.handlers.push(Pubsub.subscribe(App.Events.DELETE_ELEM, this.confirmSelectedDeletion.bind(this)));
                this.handlers.push(Pubsub.subscribe(App.Events.ENTER_CALLED, this.cancelSelectedDeletion.bind(this)));

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

                // remove null elements i.e. models that could not be fetched
                var successes = results.filter(function (e) {
                    return e;
                });

                // if the number of errors is strictly equal to the number of elements to fetch
                if (successes.length == 0) {
                    Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                }
                // there is at least on error
                else if (successes.length < this.countElements(this.collection)) {
                    Pubsub.publish(App.Events.ALERT_RAISED, ['Warning!', 'Some participants could not be retrieved', 'alert-warning']);
                }

                this.storeInLocalStorage();
                this.showTemplate();

                Pubsub.publish(App.Events.DELETIONS_POPULATED);
            },

            render:function () {
                this.initCollection();
                this.emptyJSONCollection();
                this.populateCollection();

                Pubsub.publish(App.Events.VIEW_CHANGED, [this.elemType, this.viewType]);
                $(".delete-menu.drop-zone").addClass("hidden");
                return this;
            },

            showTemplate:function () {
                var participants_template = this.participantsTemplate({'participants':this.JSONCollection['participant']});
                this.$el.html(this.template({'participants':this.JSONCollection['participant'], 'participants_template':new Handlebars.SafeString(participants_template)}));

                // if no element is currently select, select the first one
                var $selected = this.findSelected(this.$el, "li.thumbnail");
                if (!$selected || $selected.length == 0) {
                    this.selectFirst(this.$el, "li.thumbnail");
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

                var $selected = this.findSelected(this.$el, "li.thumbnail");
                if ($selected && $selected.length > 0) {
                    this.cancelDeletion($selected.attr("id"));
                }
            },

            /**
             * Confirm deletion of the selected element
             */
            confirmSelectedDeletion:function () {

                var $selected = this.findSelected(this.$el, "li.thumbnail");
                if ($selected && $selected.length > 0) {
                    this.confirmDeletion($selected.attr("id"));
                }
            },

            confirmElementDeletion:function (event) {

                event.stopPropagation();
                event.preventDefault();
                var idElem = event.currentTarget.getAttribute("id");

                this.deleteFromServer(idElem, this.onElementDeleted.bind(this));
            },

            confirmDeletion:function (idElem) {
                var elem = this.findElement(idElem);
                this.deleteFromServer(elem, this.onElementDeleted.bind(this));
            },

            onElementDeleted:function (err, result) {
                if (result.elem == null) {
                    Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'Cannot remove selected element', 'alert-error']);
                    return;
                }

                this.removeAndSave(result.elem);

                Pubsub.publish(App.Events.DELETION_CONFIRMED);
                Pubsub.publish(App.Events.ALERT_RAISED, ['Success!', 'Element deletion confirmed', 'alert-success'])
            },

            /**
             * Cancel element deletion by removing it from current deletions collection and from the current view
             *
             * @param idElem id of the element to delete
             */
            cancelDeletion:function (idElem) {

                var elem = this.findElement(idElem);
                this.removeAndSave(elem);

                Pubsub.publish(App.Events.DELETION_CANCELED);
                Pubsub.publish(App.Events.ALERT_RAISED, ['Success!', 'Element deletion canceled', 'alert-success'])
            },

            findElement:function (idElem) {
                // get collection from local storage
                this.initCollection();

                var elem = {};

                // find and remove the element from the deletions collection
                $.each(this.collection, function (type, idArray) {
                    $.each(idArray, function (index, id) {
                        if (id == idElem) {
                            elem.id = id;
                            elem.index = index;
                            elem.type = type;
                            return false;
                        }
                    }.bind(this));
                }.bind(this));

                return elem;
            },

            removeAndSave:function (elem) {

                this.selectPrevious();

                this.collection[elem.type].splice(elem.index, 1);
                // remove element from the current view
                $("#" + elem.id).remove();

                // retrieve and save the currently selected element, if any
                var $selected = this.findSelected(this.$el, "li.thumbnail");

                if (!$selected || $selected.length == 0) this.selectFirst(this.$el, "li.thumbnail");

                // save changes in local storage
                this.storeInLocalStorage();
            },

            selectNext:function () {
                this.selectElement(this.$el, "li.thumbnail", "next");
            },

            selectPrevious:function () {
                this.selectElement(this.$el, "li.thumbnail", "previous");
            }

    }));
});