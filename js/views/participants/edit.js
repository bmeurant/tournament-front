define([
    'jquery',
    'underscore',
    'backbone',
    'hbs!templates/participants/edit.html',
    'mixins/validatable',
    'pubsub',
    'resthub-backbone-validation'
], function($, _, Backbone, participantEditTemplate, Validatable, Pubsub) {

    var EditView = Backbone.View.extend(
        _.extend({}, Validatable, {

            elemType: 'participant',
            viewType: 'edit',
            template: participantEditTemplate,

            events: {
                'drop .well': 'dropHandler',
                'dragover .well': 'dragOverHandler',
                'input form input': 'onInput',
                'submit form': 'onSubmitForm',
                'keydown form input': 'onKeyDown'
            },

            initialize: function() {
                // init view bindings if only the view should be activated
                if (this.options.active == null || this.options.active == true) {
                    this.initBindings();
                }

                this.model.on("sync", this.render, this);
            },

            render: function() {
                return EditView.__super__.render.apply(this);
            },

            /**
             * Initialize all view bindings
             */
            initBindings: function() {
                // allow backbone-validation view callbacks (for error display)
                Backbone.Validation.bind(this);
                Pubsub.on(App.Events.SAVE_ELEM, this.submitForm, this);
            },

            /**
             * Remove all view bindings (events and Pubsub). Listeners will not be called anymore
             */
            removeBindings: function() {
                Backbone.Validation.unbind(this);
                Pubsub.off(null, null, this);
            },

            /**
             * Handles modification on an input element
             *
             * @param event raised event
             */
            onInput: function(event) {
                if (event != null) {
                    event.stopPropagation();
                    event.preventDefault();
                }

                // get input and parents in order to refresh error displaying components
                var target = event.currentTarget;
                var $parent = this.$(target.parentNode);
                var $help = $parent.find('.help-inline');
                var $controlGroup = $parent.parent();
                $help.text(target.validationMessage);

                if (target.validity.valid) {
                    $controlGroup.removeClass('error');
                }
                else {
                    $controlGroup.addClass('error');
                }

                // store the current field having focus to be restored later
                this.focusedField = target;
            },

            /**
             * Simulates a form submission : this is necessary to perform correctly
             * html5 validation. form.submit() does not work properly
             */
            submitForm: function() {
                this.$("form input[type='submit']").click();
            },

            /**
             * Handles form submission.
             *
             * @param event raised event
             */
            onSubmitForm: function(event) {
                if (event != null) {
                    event.stopPropagation();
                    event.preventDefault();
                }

                this.saveParticipant();
            },

            /**
             * Save the current participant (update or create depending of the existence of a valid model.id)
             */
            saveParticipant: function() {
                this.populateModel();

                // save model if its valid, display alert otherwise
                if (this.model.isValid()) {
                    this.model.save(null, {
                        success: this.onSaveSuccess.bind(this),
                        error: this.onSaveError.bind(this)
                    });
                }
                else {
                    Pubsub.trigger(App.Events.ALERT_RAISED, 'Warning!', 'Fix validation errors and try again', 'alert-warning');
                }
            },

            /**
             * Handles model save errors
             *
             * @param model model to save
             * @param resp error response
             */
            onSaveError: function(model, resp) {
                // error is an http (server) one
                if (resp.hasOwnProperty('status')) {
                    Pubsub.trigger(App.Events.ALERT_RAISED, 'Error!', 'An error occurred while trying to update this item', 'alert-error');
                }
            },

            /**
             * Handles model save success
             *
             * @param model model to save
             */
            onSaveSuccess: function(model) {
                this.model = model;

                this.clearValidationErrors();

                // if model pictureFile has changed, upload on server
                if (this.pictureFile) {
                    this.uploadFile(this.pictureFile, this.model.id, this.afterSave.bind(this));
                } else {
                    this.afterSave();
                }
            },

            /**
             * Callback called after a successful save operation
             */
            afterSave: function() {
                // store the fact that the model has been updated
                this.updated = true;

                Pubsub.trigger(App.Events.ALERT_RAISED, 'Success!', 'Participant saved successfully', 'alert-success');

                // restore the focus on the last acceded field before saving
                if (this.focusedField) {
                    this.$(this.focusedField).focus();
                }
            },

            /**
             * Handles drag over photo zone
             * @param event event raised
             *
             * @return {Boolean} false to prevent default browser behaviour
             */
            dragOverHandler: function(event) {
                event.preventDefault(); // allows us to drop
                event.originalEvent.dataTransfer.dropEffect = 'copy';
                return false;
            },

            /**
             *  Handles dropping a new photo on photo zone
             *
             * @param event event raised
             */
            dropHandler: function(event) {
                event.stopPropagation();
                event.preventDefault();

                // get the transfered file
                var e = event.originalEvent;
                e.dataTransfer.dropEffect = 'copy';
                this.pictureFile = e.dataTransfer.files[0];

                // Read the image file from the local file system and display it in the img tag
                var reader = new FileReader();
                reader.onloadend = function() {
                    this.$('.photo').attr('src', reader.result);
                };
                reader.readAsDataURL(this.pictureFile);
            },

            /**
             * Uploads a new photo file on server
             *
             * @param file file to upload
             * @param id id of the edited participant
             * @param callbackSuccess function to call in case of success
             */
            uploadFile: function(file, id, callbackSuccess) {
                // get the file
                var data = new FormData();
                data.append('file', file);

                // upload on server
                $.ajax({
                    url: App.Config.serverRootURL + '/participant/' + id + '/photo',
                    type: 'POST',
                    data: data,
                    processData: false,
                    cache: false,
                    contentType: false
                })
                    .done(function() {
                        callbackSuccess();
                    })
                    .fail(function() {
                        Pubsub.trigger(App.Events.ALERT_RAISED, 'Error!', 'An error occurred while uploading ' + file.name, 'alert-error');
                    });
            },

            /**
             * Handles keydown
             *
             * @param event event raised
             */
            onKeyDown: function(event) {

                // if ECHAP is pressed
                if (event && event.which == 27) {
                    this.blurInput();
                    return;
                }

                // if ENTER is pressed
                if (event && event.which == 13) {
                    this.submitForm();
                }
            },

            blurInput: function() {
                this.$('form input:focus').blur();
            }

        })
    );

    return EditView;
});