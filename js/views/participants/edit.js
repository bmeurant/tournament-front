define([
    'jquery',
    'underscore',
    'backbone',
    'models/participant',
    'text!templates/participants/edit.html',
    'views/participants/abstract',
    'pubsub'
], function ($, _, Backbone, Participant, participantEditTemplate, AbstractView, Pubsub) {

    var ParticipantEditView = AbstractView.extend({

        template:_.template(participantEditTemplate),
        handlers:[],
        type:'edit',

        events:{
            "change":"change",
            "drop #photo":"dropHandler"
        },

        initialize:function (id) {
            AbstractView.prototype.initialize.apply(this, arguments);
            this.events = _.extend({}, AbstractView.prototype.events, this.events);
            this.handlers = _.extend([], AbstractView.prototype.handlers, this.handlers);
            this.handlers.push(Pubsub.subscribe(Events.SAVE_ELEM, this.saveElement.bind(this)));
        },

        render:function () {
            if (this.model.id) {
                AbstractView.prototype.render.apply(this, arguments);
            }
            else {
                this.showTemplate();
            }
            return this;
        },

        change:function (event) {

            this.model.errors = {};

            // Apply the change to the model
            var target = event.target;
            var change = {};
            change[target.name] = target.value;
            this.model.set(change);
        },

        saveElement:function () {
            if (this.validate()) {
                this.saveParticipant();
            }
        },

        validate:function () {
            if (!(Object.keys(this.model.errors).length == 0)) {
                utils.displayValidationErrors(this.model.errors);
                return false;
            }

            return true;
        },

        saveParticipant:function () {
            var self = this;
            this.model.save(null, {
                success:function (model) {
                    self.model.id = model.attributes.id;
                    if (self.pictureFile) {
                        //this.model.set("picture", this.pictureFile.name);
                        self.uploadFile(self.pictureFile, self.model.id,
                            function () {
                                self.render();
                                window.location.hash = 'participant/' + self.model.id;
                            }
                        );
                    } else {
                        self.render();
                        window.location.hash = 'participant/' + self.model.id;
                    }

                    Pubsub.publish(Events.ALERT_RAISED, ['Success!', 'Participant saved successfully', 'alert-success']);
                },
                error:function () {
                    Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to update this item', 'alert-error']);
                }
            });
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
                $('#photo').attr('src', reader.result);
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