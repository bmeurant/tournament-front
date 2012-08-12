define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'models/participant',
    'text!templates/participants/edit.html',
    'backbone-validation',
    'mixins/validatable',
    'pubsub'
], function ($, _, Backbone, Handlebars, Participant, participantEditTemplate, BackboneValidation, Validatable, Pubsub) {

    return Backbone.View.extend(
        _.extend({}, Validatable, {

        elemType: 'participant',
        viewType:'edit',

        template:Handlebars.compile(participantEditTemplate),
        handlers:[],

        events:{
            "drop .well":"dropHandler",
            "dragover .well":"dragOverHandler",
            "input form input":"onInput",
            "submit form":"onSubmitForm",
            "keydown form input":"onKeyDown"
        },

        initialize:function (model, active) {
            this.model = model;

            // init view bindings if only the view should be activated
            if (active == null || active == true) {
                this.initBindings();
            }
        },

        /**
         * Initialize all view bindings
         */
        initBindings:function () {

            // allow backbone-validation view callbacks (for error display)
            Backbone.Validation.bind(this);

            this.handlers.push(Pubsub.subscribe(App.Events.SAVE_ELEM, this.submitForm.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.ENTER_CALLED, this.submitForm.bind(this)));
        },

        /**
         * Remove all view bindings (events and PubSub). Listeners will not be called anymore
         */
        removeBindings:function () {
            this.unbind();
            if (this.handlers) {
                $.each(this.handlers, function (index, value) {
                    Pubsub.unsubscribe(value);
                });
            }
        },

        render:function () {
            this.$el.html(this.template({participant:this.model.toJSON()}));
            return this;
        },

        /**
         * Handles modification on an input element
         *
         * @param event raised event
         */
        onInput:function (event) {
            if (event != null) {
                event.stopPropagation();
                event.preventDefault();
            }

            // get input and parents in order to refresh error displaying components
            var target = event.currentTarget;
            var $parent = $(target.parentNode);
            var $help = $parent.find(".help-inline");
            var $controlGroup = $parent.parent();
            $help.text(target.validationMessage);

            if (target.validity.valid) {
                $controlGroup.removeClass("error");
            }
            else {
                $controlGroup.addClass("error");
            }

            // store the current field having focus to be restored later
            this.focusedField = target;
        },

        /**
         * Simulates a form submission : this is necessary to perform correctly
         * html5 validation. form.submit() does not work properly
         */
        submitForm:function () {
            this.$el.find("form input[type='submit']").click();
        },

        /**
         * Handles form submission.
         *
         * @param event raised event
         */
        onSubmitForm:function (event) {
            if (event != null) {
                event.stopPropagation();
                event.preventDefault();
            }

            this.saveParticipant();
        },

        /**
         * Save the current participant (update or create depending of the existence of a valid model.id)
         */
        saveParticipant:function () {

            // build array of form attributes to refresh model
            var attributes = {};
            this.$el.find("form input[type!='submit']").each(function (index, value) {
                attributes[value.name] = value.value;
                this.model.set(value.name, value.value);
            }.bind(this));

            // save model if its valid, display alert otherwise
            if (this.model.isValid()) {
                this.model.save(null, {
                    success:this.onSaveSuccess.bind(this),
                    error:this.onSaveError.bind(this)
                });
            }
            else {
                Pubsub.publish(App.Events.ALERT_RAISED, ['Warning!', 'Fix validation errors and try again', 'alert-warning']);
            }
        },

        /**
         * Handles model save errors
         *
         * @param model model to save
         * @param resp error response
         */
        onSaveError:function (model, resp) {
            // error is an http (server) one
            if (resp.hasOwnProperty("status")) {
                Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to update this item', 'alert-error']);
            }
        },

        /**
         * Handles model save success
         *
         * @param model model to save
         */
        onSaveSuccess:function (model) {

            this.model = model;

            this.clearValidationErrors();

            // if model pictureFile has changed, upload on server
            if (this.pictureFile) {
                this.uploadFile(this.pictureFile, this.model.id,
                    this.afterSave().bind(this)
                );
            } else {
                this.afterSave();
            }
        },

        /**
         * Callback called after a successful save operation
         */
        afterSave:function () {
            // store the fact that the model has been updated
            this.updated = true;

            Pubsub.publish(App.Events.ALERT_RAISED, ['Success!', 'Participant saved successfully', 'alert-success']);

            // restore the focus on the last acceded field before saving
            if (this.focusedField) {
                $(this.focusedField).focus();
            }
        },

        /**
         * Handles drag over photo zone
         * @param event event raised
         *
         * @return {Boolean} false to prevent default browser behaviour
         */
        dragOverHandler:function (event) {
            event.preventDefault(); // allows us to drop
            event.originalEvent.dataTransfer.dropEffect = 'copy';
            return false;
        },

        /**
         *  Handles dropping a new photo on photo zone
         *
         * @param event event raised
         */
        dropHandler:function (event) {
            event.stopPropagation();
            event.preventDefault();

            // get the transfered file
            var e = event.originalEvent;
            e.dataTransfer.dropEffect = 'copy';
            this.pictureFile = e.dataTransfer.files[0];

            // Read the image file from the local file system and display it in the img tag
            var reader = new FileReader();
            reader.onloadend = function () {
                $('.photo').attr('src', reader.result);
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
        uploadFile:function (file, id, callbackSuccess) {
            // get the file
            var data = new FormData();
            data.append('file', file);

            // upload on server
            $.ajax({
                url:'http://localhost:3000/api/participant/' + id + '/photo',
                type:'POST',
                data:data,
                processData:false,
                cache:false,
                contentType:false
            })
                .done(function () {
                    callbackSuccess();
                })
                .fail(function () {
                    Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'An error occurred while uploading ' + file.name, 'alert-error']);
                });
        },

        /**
         * Handles keydown
         *
         * @param event event raised
         */
        onKeyDown:function (event) {

            // if ECHAP is pressed
            if (event && event.which == 27) {
                this.blurInput();
            }
        },

        blurInput:function () {
            this.$el.find("form input:focus").blur();
        }

    }));
});