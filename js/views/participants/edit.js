define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/edit.html',
    'pubsub'
], function ($, _, Backbone, Participant, participantEditTemplate, Pubsub) {

    var ParticipantEditView = Backbone.View.extend({

        template:_.template(participantEditTemplate),
        handlers:[],
        type:'edit',

        events:{
            "drop .photo":"dropHandler"
        },

        initialize:function (model, active) {
            this.model = model;
            if (active == null || active == true) {
                this.initBindings();
            }
        },

        initBindings:function () {
            this.handlers.push(Pubsub.subscribe(Events.SAVE_ELEM, this.saveParticipant.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.ENTER_CALLED, this.saveParticipant.bind(this)));
        },

        removeBindings:function () {
            this.unbind();
            if (this.handlers) {
                $.each(this.handlers, function (index, value) {
                    Pubsub.unsubscribe(value);
                });
            }
        },

        render:function () {
            this.$el.html(this.template({participant:this.model.toJSON(), server_url:'http://localhost:3000/api'}));
            return this;
        },

        saveParticipant:function (event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            var attributes = {};
            this.$el.find("form input:not('disabled')").each(function (index, value) {
                attributes[value.name] = value.value;
            });

            this.model.save(attributes, {
                success:this.onSaveSuccess.bind(this),
                error:this.onSaveError.bind(this)
            });
        },

        onSaveError:function (model, resp) {
            utils.clearValidationErrors();
            // error is an http one
            if (resp.hasOwnProperty("status")) {
                Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to update this item', 'alert-error']);
            }
            else {
                // validation errors
                utils.displayValidationErrors(resp);
            }
        },

        onSaveSuccess:function (model, resp) {
            utils.clearValidationErrors();

            this.model.id = model.attributes.id;
            if (this.pictureFile) {
                this.uploadFile(self.pictureFile, this.model.id,
                    this.afterSave().bind(this)
                );
            } else {
                this.afterSave();
            }
        },

        afterSave:function () {

            window.location.hash = 'participant/' + this.model.id;

            Pubsub.publish(Events.ALERT_RAISED, ['Success!', 'Participant saved successfully', 'alert-success']);
        },

        dropHandler:function (event) {
            event.stopPropagation();
            event.preventDefault();
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

        uploadFile:function (file, id, callbackSuccess) {
            var self = this;
            var data = new FormData();
            data.append('file', file);
            $.ajax({
                url:'http://localhost:3000/api/participant/' + id + '/photo',
                type:'POST',
                data:data,
                processData:false,
                cache:false,
                contentType:false
            })
                .done(function (response) {
                    console.log(file.name + " uploaded successfully");
                    callbackSuccess();
                })
                .fail(function (jqXHR, textStatus, errorMessage) {
                    Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while uploading ' + file.name, 'alert-error']);
                });
        }

    });

    return ParticipantEditView;
});