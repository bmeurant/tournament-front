define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'collections/participants',
    'hbs!templates/participants/list.html',
    'hbs!templates/participants/miniature.html',
    'mixins/selectable',
    'mixins/paginable',
    'pubsub',
    'bootstrap'
], function($, _, Backbone, Handlebars, ParticipantsCollection, listTemplate, participantMiniatureTemplate, Selectable, Paginable, Pubsub) {

    return Backbone.View.extend(
        _.extend(Selectable, Paginable, {

            elemType: 'participant',

            tagName: 'ul',
            attributes: {
                class: 'thumbnails'
            },

            events: {
                "dragstart li.thumbnail[draggable='true']": 'dragStartHandler',
                "dragend li.thumbnail[draggable='true']": 'dragEndHandler',
                'focusin ul.thumbnails li.thumbnail a': 'elemFocused',
                'focusout ul.thumbnails li.thumbnail a': 'elemFocused',
                'click li.thumbnail': 'hideTooltips'
            },

            initialize: function() {
                this.collection.on('sync', this.render.bind(this));

                Pubsub.on(App.Events.ELEM_DELETED_FROM_BAR, this.participantDeleted, this);
                Pubsub.on(App.Events.DELETIONS_CANCELED, this.cancelDeletions, this);
                Pubsub.on(App.Events.NEXT_CALLED, this.selectNextElem, this);
                Pubsub.on(App.Events.PREVIOUS_CALLED, this.selectPreviousElem, this);
                Pubsub.on(App.Events.DELETE_ELEM, this.deleteParticipant, this);
                Pubsub.on(App.Events.DELETE_ELEM_FROM_BAR, this.deleteParticipant, this);
                Pubsub.on(App.Events.ENTER_CALLED, this.showSelected, this);
                Pubsub.on(App.Events.ELEM_DELETED_FROM_VIEW, this.participantDeleted, this);
                Pubsub.on(App.Events.NEW_PAGE, this.newPage, this);
                Pubsub.on(App.Events.DELETIONS_CONFIRMED, this.render, this);

                this.initDeleted();

                Handlebars.registerHelper('if_deleted', function(id, options) {

                    if (this.deleted.indexOf(id.toString()) >= 0) {
                        return options.fn(this);
                    } else {
                        return options.inverse(this);
                    }
                }.bind(this));

                Handlebars.registerHelper('disabled', function(id) {
                    return (this.deleted.indexOf(id.toString()) >= 0) ? 'disabled' : '';
                }.bind(this));

                var askedPage = 1;
                if (this.options.params) {
                    if (this.options.params.page && this.isValidPageNumber(this.options.params.page)) askedPage = parseInt(this.options.params.page);
                }

                this.newPage(askedPage);
            },

            render: function() {

                this.hideTooltips();

                this.$el.html(listTemplate({participants: this.collection.toJSON(), 'id_selected': this.idSelected}));

                this.initTooltips();

                if (this.previousPage && (this.previousPage > this.collection.currentPage )) {
                    this.selectLast(this.$el, 'li.thumbnail');
                }

                // if no element is currently select, select the first one
                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                if (!$selected || $selected.length == 0) {
                    this.selectFirst(this.$el, 'li.thumbnail');
                }

                window.history.pushState(null, 'Tournament', '/participants' + ((this.collection.info().currentPage != 1) ? '?page=' + this.collection.info().currentPage : ''));

                return this;
            },

            /**
             * Handles drag start on a participant element
             *
             * @param event event raised
             */
            dragStartHandler: function(event) {
                event.originalEvent.dataTransfer.effectAllowed = 'move'; // only dropEffect='copy' will be droppable

                // get id of the dragged element and set transfer data
                var id = event.currentTarget.getAttribute('id');
                event.originalEvent.dataTransfer.setData('id', id);
                event.originalEvent.dataTransfer.setData('elemType', 'participant');

                // get corresponding model
                var participant = this.getModel(id);

                // create miniature shown during drag
                // this miniature must be already rendered by the browser and not hidden -> should be positioned
                // out of visible page
                // To embed remote image, this should be cacheable and the remote server should implement the
                // corresponding cache politic
                var dragIcon = $('#dragIcon');
                dragIcon.html(participantMiniatureTemplate({participant: participant.toJSON()}));
                event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 25, 25);

                Pubsub.trigger(App.Events.DRAG_START);
            },

            dragEndHandler: function(event) {
                Pubsub.trigger(App.Events.DRAG_END);
            },

            /**
             * @param id
             * @return {*} the model object in models collection from its id
             */
            getModel: function(id) {
                var mod = null;
                $.each(this.collection.models, function(index, model) {
                    if (model.id == id) {
                        mod = model;
                        return false;
                    }
                });
                return mod;
            },

            initTooltips: function() {
                // initialize tooltips
                this.$el.find('li.thumbnail').tooltip({title: 'drag on delete drop-zone to remove<br/>click to view details', trigger: 'hover', placement: this.liTooltipPlacement});
                // cannot define a tooltip on a same selector twice : define one on 'a' to link with focus event
                this.$el.find('li.thumbnail > a').tooltip({title: 'press <code>Del</code> to remove<br/>press <code>Enter</code> to view details', trigger: 'focus', placement: this.liTooltipPlacement});
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
                this.$el.find('li.thumbnail').tooltip('hide');
                this.$el.find('li.thumbnail a').tooltip('hide');
            },

            /**
             * Handles deletions cancellation by reintegrating previously deleted elements in the
             * currently displayed list
             */
            cancelDeletions: function() {

                // retrieve and save the currently selected element, if any
                var $selected = this.findSelected(this.$el, 'li.thumbnail');

                if ($selected && $selected.length > 0) {
                    this.idSelected = this.findSelected(this.$el, 'li.thumbnail').get(0).id;
                }

                this.initDeleted();

                // re-render view selecting the previously selected element
                this.render();
            },

            /**
             * Handles effective deletion of a list element (exemple: after a dra-drop or a del.)
             *
             * @param id deleted participant id
             */
            participantDeleted: function(id) {
                var $element = $('#' + id);

                // remove deleted element
                $element.addClass('disabled');
                $('<div>').addClass('foreground').appendTo($element);

                // if the deleted element is selected, select previous
                if ($element.hasClass('selected')) {
                    this.selectNext(this.$el, 'li.thumbnail');
                }

                // if no element is currently select, select the first one
                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                if (!$selected || $selected.length == 0) {
                    this.selectFirst(this.$el, 'li.thumbnail');
                }

            },

            /**
             * Ask for deletion for the currently selected element
             */
            deleteParticipant: function() {

                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                if ($selected && $selected.length > 0) {
                    Pubsub.trigger(App.Events.DELETE_ELEM_FROM_VIEW, 'participant', $selected.get(0).id);
                }
            },

            selectNextElem: function(event) {
                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                var $newSelected = this.selectElement(this.$el, 'li.thumbnail', 'next');

                if ($selected.attr('id') == $newSelected.attr('id')) {
                    if (this.collection.next) {
                        this.newPage(this.collection.next);
                    }
                }

            },

            selectPreviousElem: function(event) {
                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                var $newSelected = this.selectElement(this.$el, 'li.thumbnail', 'previous');

                if ($selected.attr('id') == $newSelected.attr('id')) {
                    if (this.collection.previous) {
                        this.newPage(this.collection.previous);
                    }
                }
            },

            /**
             * Navigates to the details view of the currently selected element
             */
            showSelected: function() {
                var $selected = this.findSelected(this.$el, 'li.thumbnail');
                this.hideTooltips();
                if ($selected && $selected.length > 0) {
                    Backbone.history.navigate('/participant/' + $selected.get(0).id, true);
                }
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

            newPage: function(id) {
                this.previousPage = this.collection.currentPage;

                // get the participants collection from server
                this.collection.goTo(id,
                    {
                        error: function() {
                            Pubsub.trigger(App.Events.ALERT_RAISED, 'Error!', 'An error occurred while trying to fetch participants', 'alert-error');
                        }
                    });
            },

            initDeleted: function() {
                // get the list of current deleted elements from local storage in order to exclude these
                // elements from rendered view
                this.deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
                if (!this.deleted) {
                    this.deleted = [];
                }
            },

            onDispose: function() {
                this.hideTooltips();
            }

        }));
});