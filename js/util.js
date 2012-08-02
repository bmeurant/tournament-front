define([
    'jquery',
    'pubsub'
], function ($, Pubsub) {
    utils = {
        displayValidationErrors:function (errors) {
            for (var key in errors) {
                if (errors.hasOwnProperty(key)) {
                    this.addValidationError(key, errors[key]);
                }
            }
            Pubsub.publish(Events.ALERT_RAISED, ['Warning!', 'Fix validation errors and try again', 'alert-warning']);
        },

        addValidationError:function (field, message) {
            var controlGroup = $('#' + field).parent().parent();
            controlGroup.addClass('error');
            $('.help-inline', controlGroup).html(message);
        },

        clearValidationErrors:function () {
            $('.control-group').removeClass("error");
            $('.help-inline').empty();
        },

        showView:function (selector, View, args) {

            args = args || [];

            if (classes.Views.currentView)
                classes.Views.currentView.close();
            args.splice(0,0, this);
            var view = new (Function.prototype.bind.apply (View, args));
            $(selector).html(view.render().el);
            classes.Views.currentView = view;
            return view;
        },

        mapLength:function (map) {
            var length = 0;
            $.each(map, function (index, value) {
                length += value.length;
            });
            return length;
        }

    };
});