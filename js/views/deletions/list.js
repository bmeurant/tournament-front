define([
    'underscore',
    'resthub-handlebars',
    'hbs!templates/deletions/list.html',
    'views/deletions/abstract',
    'hbs!templates/participants/list.html',
    'models/participant',
    'collections/participants',
    'mixins/selectable',
    'pubsub',
    'i18n!nls/messages',
    'async'
], function(_, Handlebars, deletionsTemplate, AbstractView, participantTemplate, Participant, ParticipantCollection, Selectable, Pubsub, messages) {

    /**
     * Main view for displaying deletions
     */
    var DeletionsList = AbstractView.extend(
        _.extend({}, Selectable, {

            elemType: 'deletions',
            viewType: 'list',
            template: deletionsTemplate,

            events: {
                'click #deletions-container li.thumbnail': 'elemClicked',
                'dblclick #deletions-container li.thumbnail': 'elemDblClicked',
                'focusin ul.thumbnails li.thumbnail a': 'elemFocused',
                'focusout ul.thumbnails li.thumbnail a': 'elemFocused'
            },

            attributes: {
                id: 'deletions-container'
            },

            initialize: function() {

                this.events = _.extend({}, AbstractView.prototype.events, this.events);
                // call inherited constructor
                AbstractView.prototype.initialize.apply(this, arguments);

                Handlebars.registerHelper('if_deleted', function() {
                    return false;
                });

                Handlebars.registerHelper('disabled', function() {
                    return '';
                });

                Handlebars.registerHelper('selected', function(id) {
                    return (this.idSelected && this.idSelected == id) ? 'selected' : '';
                }.bind(this));

                // set defaut handler for click in order to handle both simple and dble click
                this.firingFunc = this.cancelElementDeletion.bind(this);

                // init Pubsub bindings
                Pubsub.on(App.Events.DELETIONS_CONFIRMED, this.refreshView, this);
                Pubsub.on(App.Events.DELETIONS_CANCELED, this.refreshView, this);
                Pubsub.on(App.Events.NEXT_CALLED, this.selectNext, this);
                Pubsub.on(App.Events.PREVIOUS_CALLED, this.selectPrevious, this);
                Pubsub.on(App.Events.DELETE_ELEM, this.confirmSelectedDeletion, this);
                Pubsub.on(App.Events.ENTER_CALLED, this.cancelSelectedDeletion, this);

                this.refreshView();
            },

            initCollections: function() {
                this.initCollection();

                if (!this.collections || this.collections.keys == 0) {
                    this.collections = {};
                    var participantCollection = new ParticipantCollection();
                    this.collections.participant = participantCollection;
                }
                else {
                    this.emptyCollections();
                }

                for (var index in this.idsCollection.participant) {
                    this.collections.participant.add(new Participant({id: this.idsCollection.participant[index]}));
                }

                this.collections.participant.on("remove", function(model) {
                    this.idsCollection.participant.splice(this.idsCollection.participant.indexOf(model.id), 1);
                }.bind(this))
            },

            /**
             * Creates an empty models collection with the correct format
             */
            emptyCollections: function() {
                this.collections.participant.reset();
            },

            /**
             * Populate and initialize properly instance collections in order to prepare rendering.
             */
            populateCollections: function() {
                // if collection is empty, don't do anything but rendering view
                if (this.countElements(this.collections) == 0) {
                    this.render();
                }
                else {
                    var elements = [];
                    $.each(this.collections, function(elemType, collection) {
                        elements = elements.concat(collection.models);
                    }.bind(this));

                    async.map(elements, this.fetchElement.bind(this), this.afterPopulate.bind(this));
                }
            },

            fetchElement: function(model, fetchCallback) {

                var type = this.getModelType(model);

                model.fetch({wait: true,
                    success: function(model) {
                        // add model to current collection and call callback
                        this.collections[type].add(model);
                        fetchCallback(null, model);
                    }.bind(this),
                    error: function(model, response) {
                        if (response.status == 404) {
                            // element obviously already deleted from server. Ignore it and remove from local collection
                            this.collections[type].remove(model);
                        }

                        // callback is called with null error parameter because otherwise it breaks the
                        // loop and top on first error :-(
                        fetchCallback(null, null);
                    }.bind(this)
                });
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
                    Pubsub.trigger(App.Events.ALERT_RAISED, messages.error, messages.errorFetchParticipants, 'alert-error');
                }
                // there is at least on error
                else if (successes.length < this.countElements(this.collections)) {
                    Pubsub.trigger(App.Events.ALERT_RAISED, messages.warning, messages.warningRetrieveSomeParticipants, 'alert-warning');
                }

                this.storeInLocalStorage();
                this.render();

                Pubsub.trigger(App.Events.DELETIONS_POPULATED);
            },

            render: function() {
                var participants_template = participantTemplate({'participants': this.collections.participant.toJSON()});
                DeletionsList.__super__.render.apply(this, [{'hasParticipants': this.collections.participant.length > 0, 'participants_template': new Handlebars.SafeString(participants_template), messages: messages}]);

                this.initTooltips();

                // if no element is currently select, select the first one
                var $selected = this.findSelected('li.thumbnail');
                if (!$selected || $selected.length == 0) {
                    this.selectFirst('li.thumbnail');
                }


                this.$('.delete-menu.drop-zone').addClass('hidden');
                Pubsub.trigger(App.Events.VIEW_CHANGED, this.elemType, this.viewType);
                return this;
            },

            refreshView: function() {
                this.hideTooltips();
                this.initCollections();
                this.populateCollections();
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

                this.cancelDeletion(idElem);
            },

            /**
             * Cancel deletion of the selected element
             */
            cancelSelectedDeletion: function() {

                var $selected = this.findSelected('li.thumbnail');
                if ($selected && $selected.length > 0) {
                    var idElem = $selected.attr('id');
                    this.cancelDeletion(idElem);
                }
            },

            /**
             * Confirm deletion of the selected element
             */
            confirmSelectedDeletion: function() {

                var $selected = this.findSelected('li.thumbnail');
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
                var model = this.collections[elemType].where({id: parseInt(idElem)})[0];

                var $element = this.$('.' + elemType + '#' + model.id);
                $element.addClass('disabled');
                this.$('<div>').addClass('foreground').appendTo($element);
                $element.removeClass("selected");

                this.deleteFromServer(model, this.onElementDeleted.bind(this));
            },

            onElementDeleted: function(err, result) {
                if (result.model == null) {
                    Pubsub.trigger(App.Events.ALERT_RAISED, messages.error, messages.errorCannotRemoveElement, 'alert-error');
                    return;
                }

                this.removeAndSave(result.model);

                Pubsub.trigger(App.Events.DELETION_CONFIRMED);
                Pubsub.trigger(App.Events.ALERT_RAISED, messages.success, messages.successElementDeletionConfirmed, 'alert-success');
            },

            /**
             * Cancel element deletion by removing it from current deletions collection and from the current view
             *
             * @param elemType type of the element to delete
             * @param idElem id of the element to delete
             */
            cancelDeletion: function(idElem) {

                var elemClass = this.getElementClass(idElem);
                var model = new elemClass({id: parseInt(idElem)});
                this.removeAndSave(model);

                Pubsub.trigger(App.Events.DELETION_CANCELED);
                Pubsub.trigger(App.Events.ALERT_RAISED, messages.success, messages.successDeletionCanceled, 'alert-success');
            },

            removeAndSave: function(model) {

                var type = this.getModelType(model);

                this.hideTooltips();

                this.idsCollection[type].splice(this.idsCollection[type].indexOf(model.id), 1);
                // remove element from the current view
                this.$('.' + type + '#' + model.id).remove();

                // retrieve and save the currently selected element, if any
                var $selected = this.findSelected('li.thumbnail');

                this.selectNext();

                if (!$selected || $selected.length == 0) this.selectFirst('li.thumbnail');

                // save changes in local storage
                this.storeInLocalStorage();
            },

            selectNext: function() {
                this.selectElement('li.thumbnail', 'next');
            },

            selectPrevious: function() {
                this.selectElement('li.thumbnail', 'previous');
            },

            /**
             * Give 'focus' on the currently selected element.
             * Remove focus if no element selected
             *
             * @param event event raised
             */
            elemFocused: function(event) {
                if (event && event.currentTarget) {
                    var $selected = this.findSelected('li.thumbnail');
                    if ($selected && $selected.length != 0) {
                        $selected.removeClass('selected');
                    }
                    this.$(event.currentTarget).parent().addClass('selected');
                }
            },

            initTooltips: function() {
                // initialize tooltips
                this.$('li.thumbnail').tooltip({title: messages.tooltipDelsHover, trigger: 'hover', placement: this.liTooltipPlacement});
                // cannot define a tooltip on a same selector twice : define one on 'a' to link with focus event
                this.$('li.thumbnail > a').tooltip({title: messages.tooltipDelsFocus, trigger: 'focus', placement: this.liTooltipPlacement});
            },

            /**
             * Calculate tooltip placement
             * @param tip tooltip to display
             * @param target DOM element 'tooltiped'
             * @return {String}
             */
            liTooltipPlacement: function(tip, target) {

                var $target = $(target);

                // if target is a : found the real target (parent li) and force
                // bootstrap-tooltip to consider this element instead of original 'a'
                if (target.tagName == 'A') {
                    $('li.thumbnail').tooltip('hide');
                    $target = $target.parent();
                    this.$element = $target;
                }
                else {
                    $('li.thumbnail a').tooltip('hide');
                }

                var index = $target.index();
                var liWidth = $target.outerWidth(true);
                var ulWidth = $target.parent().innerWidth(false);
                var perLine = Math.floor(ulWidth / liWidth);

                if (index < perLine) return 'top';
                return 'bottom';

            },

            hideTooltips: function() {
                this.$('li.thumbnail').tooltip('hide');
                this.$('li.thumbnail a').tooltip('hide');
            },

            onDispose: function() {
                this.hideTooltips();
            },

            /**
             * Retrieve element type from a dom selected or clicked li element
             * @param liElemId
             */
            getElementType: function(liElemId) {
                if (this.$('#' + liElemId).hasClass('participant')) return 'participant';
            },

            getElementClass: function(liElemId) {
                if (this.$('#' + liElemId).hasClass('participant')) return Participant;
            }

        }));

    return DeletionsList;
});