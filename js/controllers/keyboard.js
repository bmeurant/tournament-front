define([
    'jquery',
    'pubsub'
], function ($, PubSub) {

    var KeyboardController = function () {

        this.LEFT_ARROW = 37;
        this.RIGHT_ARROW = 39;
        this.DEL = 46;
        this.ENTER = 13;

        this.bindings = {};

        this.init();
    };

    $.extend(KeyboardController.prototype, {

        init:function () {

            this.bindings[this.LEFT_ARROW] = this.precedent;
            this.bindings[this.RIGHT_ARROW] = this.next;
            this.bindings[this.DEL] = this.del;
            this.bindings[this.ENTER] = this.enter;

            $(document).keydown(this.onKeyDown.bind(this));
        },

        onKeyDown:function (event) {
            if (this.bindings[event.which]) {
                this.bindings[event.which].apply(this);
            }
        },

        precedent:function () {
            PubSub.publish(Events.PREVIOUS_CALLED);
        },

        next:function () {
            PubSub.publish(Events.NEXT_CALLED);
        },

        del:function () {
            PubSub.publish(Events.DELETE_ELEM);
        },

        enter:function () {
            PubSub.publish(Events.ENTER_CALLED);
        }

    });

    return KeyboardController;
});
