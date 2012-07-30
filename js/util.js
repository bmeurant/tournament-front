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

        showView:function (selector, view) {
            if (classes.Views.currentView)
                classes.Views.currentView.close();
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