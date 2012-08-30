define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'hbs!templates/deletions/list.html',
    'views/deletions/abstract',
    'hbs!templates/participants/listItems.html',
    'models/participant',
    'mixins/selectable',
    'pubsub',
    'async'
], function($, _, Backbone, Handlebars, deletionsTemplate, AbstractView, participantTemplate, Participant, Selectable, Pubsub) {

    /**
     * Main view for displaying deletions
     */
    return AbstractView.extend(
        _.extend({}, Selectable, {

            elemType: 'deletions',
            viewType: 'list',

            events: {
                'click #deletions-container li.thumbnail': 'elemClicked',
                'dblclick #deletions-container li.thumbnail': 'elemDblClicked',
                'focusin ul.thumbnails li.thumbnail a': 'elemFocused',
                'focusout ul.thumbnails li.thumbnail a': 'elemFocused'
            },

            attributes: {
                id: 'deletions-container'
            },

            JSONCollection: {},

            initialize: function() {

                // call inherited constructor
                AbstractView.prototype.initialize.apply(this, arguments);
                this.events = _.extend({}, AbstractView.prototype.events, this.events);
                this.handlers = _.extend([], AbstractView.prototype.handlers, this.handlers);

                // set defaut handler for click in order to handle both simple and dble click
                this.firingFunc = this.cancelElementDeletion.bind(this);

                // init Pubsub bindings
                Pubsub.on(App.Events.DELETIONS_CONFIRMED, this.render, this);
                Pubsub.on(App.Events.DELETIONS_CANCELED, this.render, this);
                Pubsub.on(App.Events.NEXT_CALLED, this.selectNext, this);
                Pubsub.on(App.Events.PREVIOUS_CALLED, this.selectPrevious, this);
                Pubsub.on(App.Events.DELETE_ELEM, this.confirmSelectedDeletion, this);
                Pubsub.on(App.Events.ENTER_CALLED, this.cancelSelectedDeletion, this);

                this.emptyJSONCollection();

                Handlebars.registerHelper('if_deleted', function() {
                    return false;
                });

                Handlebars.registerHelper('disabled', function() {
                    return '';
                });

                Handlebars.registerHelper('selected', function(id) {
                    return (this.idSelected && this.idSelected == id) ? 'selected' : '';
                }.bind(this));

            },

            /**
             * Creates an empty models collection with the correct format
             */
            emptyJSONCollection: function() {
                this.JSONCollection.participant = [];
            },

            /**
             * Populate and initialize properly instance collections in order to prepare rendering.
             */
            populateCollection: function() {

                // if collection is empty, don't do anything but rendering view
                if (this.countElements(this.elemCollection) == 0) {
                    this.showTemplate();
                }
                else {
                    var elements = [];
                    $.each(this.elemCollection, function(elemType, idArray) {
                        $.each(idArray, function(index, id) {
                            elements.push({type: elemType, id: id, index: index});

                        }.bind(this));
                    }.bind(this));

                    async.map(elements, this.fetchElement.bind(this), this.afterPopulate.bind(this));
                }
            },

            fetchElement: function(elem, fetchCallback) {
                $.getJSON(App.Config.serverRootURL + '/' + elem.type + '/' + elem.id)
                    .done(function(data) {
                    // add model to current collection and call callback
                    this.JSONCollection[elem.type].push(data);
                    fetchCallback(null, elem);
                }.bind(this))
                    .fail(function(jqXHR) {
                    if (jqXHR.status == 404) {
                        // element obviously already deleted from server. Ignore it and remove from local collection
                        this.elemCollection[elem.type].splice(elem.index, 1);
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
            afterPopulate: function(err, results) {

                // remove null elements i.e. models that could not be fetched
                var successes = results.filter(function(e) {
                    return e;
                });

                // if the number of errors is strictly equal to the number of elements to fetch
                if (successes.length == 0) {
                    Pubsub.trigger(App.Events.ALERT_RAISED, 'Error!', 'An error occurred while trying to fetch participants', 'alert-error');
                }
                // there is at least on error
                else if (successes.length < this.countElements(this.elemCollection)) {
                    Pubsub.trigger(App.Events.ALERT_RAISED, 'Warning!', 'Some participants could not be retrieved', 'alert-warning');
                }

                this.storeInLocalStorage();
                this.showTemplate();

                Pubsub.trigger(App.Events.DELETIONS_POPULATED);
            },

            render: function() {
                this.hideTooltips();
                this.initCollection();
                this.emptyJSONCollection();
                this.populateCollection();

                Pubsub.trigger(App.Events.VIEW_CHANGED, this.elemType, this.viewType);
                $('.delete-menu.drop-zone').addClass('hidden');
                return this;
            },

            showTemplate: function() {
                var participants_template = participantTemplate({'participants': this.JSONCollection['participant']});
                this.$el.html(deletionsTemplate({'participants': this.JSONCollection['participant'], 'participants_template': new Handlebars.SafeString(participants_template)}));

                this.initTooltips();

                // if no element is currently select, select the first one
                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                if (!$selected || $selected.length == 0) {
                    this.selectFirst(this.$el, 'li.thumbnail');
                }

            },

            elemClicked: function(event) {
                if (event) {
                    event.stopPropagation();
                    event.preventDefault();
                }

                // Detect the 2nd single click event, so we can stop it
                if (this.firing)
                    return;

                this.firing = true;
                var timer = setTimeout(function() {
                    this.firingFunc.call(this, event);

                    // Always revert back to singleClick firing function
                    this.firingFunc = this.cancelElementDeletion.bind(this);
                    this.firing = false;
                }.bind(this), 150);
            },

            elemDblClicked: function(event) {

                if (event) {
                    event.stopPropagation();
                    event.preventDefault();
                }

                this.firingFunc = this.confirmElementDeletion.bind(this);
            },

            /**
             * Cancel deletion of the current element
             *
             * @param event event raised if any
             */
            cancelElementDeletion: function(event) {
                if (event) {
                    event.stopPropagation();
                    event.preventDefault();
                }

                var idElem = event.currentTarget.getAttribute('id');

                this.cancelDeletion(this.getElementType(idElem), idElem);
            },

            /**
             * Cancel deletion of the selected element
             */
            cancelSelectedDeletion: function() {

                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                if ($selected && $selected.length > 0) {
                    var idElem = $selected.attr('id');
                    this.cancelDeletion(this.getElementType(idElem), idElem);
                }
            },

            /**
             * Confirm deletion of the selected element
             */
            confirmSelectedDeletion: function() {

                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                if ($selected && $selected.length > 0) {
                    var idElem = $selected.attr('id');
                    this.confirmDeletion(this.getElementType(idElem), idElem);
                }
            },

            confirmElementDeletion: function(event) {
                if (event) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                var idElem = event.currentTarget.getAttribute('id');

                this.confirmDeletion(this.getElementType(idElem), idElem);
            },

            /**
             * Confirm element deletion by sending delete request to server
             *
             * @param elemType type of the element to delete
             * @param idElem id of the element to delete
             */
            confirmDeletion: function(elemType, idElem) {
                var elem = this.findElement(elemType, idElem);
                this.deleteFromServer(elem, this.onElementDeleted.bind(this));
            },

            onElementDeleted: function(err, result) {
                if (result.elem == null) {
                    Pubsub.trigger(App.Events.ALERT_RAISED, 'Error!', 'Cannot remove selected element', 'alert-error');
                    return;
                }

                this.removeAndSave(result.elem);

                Pubsub.trigger(App.Events.DELETION_CONFIRMED);
                Pubsub.trigger(App.Events.ALERT_RAISED, 'Success!', 'Element deletion confirmed', 'alert-success');
            },

            /**
             * Cancel element deletion by removing it from current deletions collection and from the current view
             *
             * @param elemType type of the element to delete
             * @param idElem id of the element to delete
             */
            cancelDeletion: function(elemType, idElem) {

                var elem = this.findElement(elemType, idElem);
                this.removeAndSave(elem);

                Pubsub.trigger(App.Events.DELETION_CANCELED);
                Pubsub.trigger(App.Events.ALERT_RAISED, 'Success!', 'Element deletion canceled', 'alert-success');
            },

            findElement: function(elemType, idElem) {
                // get collection from local storage
                this.initCollection();

                var elem = {};

                // find and remove the element from the deletions collection
                $.each(this.elemCollection[elemType], function(index, id) {
                    if (id == idElem) {
                        elem.id = id;
                        elem.index = index;
                        elem.type = elemType;
                        return false;
                    }
                }.bind(this));

                return elem;
            },

            removeAndSave: function(elem) {

                this.hideTooltips();

                this.elemCollection[elem.type].splice(elem.index, 1);
                // remove element from the current view
                $('#' + elem.id).remove();

                // retrieve and save the currently selected element, if any
                var $selected = this.findSelected(this.$el, 'li.thumbnail');

                this.selectNext();

                if (!$selected || $selected.length == 0) this.selectFirst(this.$el, 'li.thumbnail');

                // save changes in local storage
                this.storeInLocalStorage();
            },

            selectNext: function() {
                this.selectElement(this.$el, 'li.thumbnail', 'next');
            },

            selectPrevious: function() {
                this.selectElement(this.$el, 'li.thumbnail', 'previous');
            },

            /**
             * Give 'focus' on the currently selected element.
             * Remove focus if no element selected
             *
             * @param event event raised
             */
            elemFocused: function(event) {
                if (event && event.currentTarget) {
                    var $selected = this.findSelected(this.$el, 'li.thumbnail');
                    if ($selected && $selected.length != 0) {
                        $selected.removeClass('selected');
                    }
                    $(event.currentTarget).parent().addClass('selected');
                }
            },

            initTooltips: function() {
                // initialize tooltips
                this.$el.find('li.thumbnail').tooltip({title: 'double click to remove, simple click to cancel', trigger: 'hover', placement: this.liTooltipPlacement});
                // cannot define a tooltip on a same selector twice : define one on 'a' to link with focus event
                this.$el.find('li.thumbnail > a').tooltip({title: 'press <code>Del</code> to remove<br/>press <code>Enter</code> to cancel', trigger: 'focus', placement: this.liTooltipPlacement});
            },

            /**
             * Calculate tooltip placement
             * @param tip tooltip to display
             * @param target DOM element 'tooltiped'
             * @return {String}
             */
            liTooltipPlacement: function(tip, target) {

                $('li.thumbnail').tooltip('hide');
                $('li.thumbnail a').tooltip('hide');
                var $target = $(target);

                // if target is a : found the real target (parent li) and force
                // bootstrap-tooltip to consider this element instead of original 'a'
                if (target.tagName == 'A') {
                    $target = $target.parent();
                    this.$element = $target;
                }
                var index = $target.index();
                var liWidth = $target.outerWidth(true);
                var ulWidth = $target.parent().innerWidth(false);
                var perLine = Math.floor(ulWidth / liWidth);

                if (index < perLine) return 'top';
                return 'bottom';

            },

            hideTooltips: function() {
                this.$el.find('li.thumbnail').tooltip('hide');
                this.$el.find('li.thumbnail a').tooltip('hide');
            },

            onDispose: function() {
                this.hideTooltips();
            },

            /**
             * Retrieve element type from a dom selected or clicked li element
             * @param liElemId
             */
            getElementType: function(liElemId) {
                if ($('#' + liElemId).hasClass('participant')) return 'participant';
            }

        }));
});