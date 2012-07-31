define([
    'jquery',
    'pubsub'
], function ($, PubSub) {

    var KeyboardController = function () {

        this.LEFT_ARROW = 37;
        this.RIGHT_ARROW = 39;

        this.bindings = {};

        this.init();
    };

    $.extend(KeyboardController.prototype, {

        init:function () {

            this.bindings[this.LEFT_ARROW] = this.precedent;
            this.bindings[this.RIGHT_ARROW] = this.next;

            $(document).keydown(this.onKeyDown.bind(this));
        },

        onKeyDown:function (event) {
            if (this.bindings[event.which]) {
                this.bindings[event.which].apply(this);
            }
        },

        precedent: function () {
           PubSub.publish(Events.PRECEDENT_CALLED);
        },

        next: function () {
            PubSub.publish(Events.NEXT_CALLED);
        }

    });

    return KeyboardController;
});
