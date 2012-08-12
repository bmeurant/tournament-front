define([
    'jquery',
    'pubsub'
], function ($, PubSub) {

    /**
     * Global controller allowing to map and publish keyboard events and controls
     */
    var KeyboardController = function () {

        this.LEFT_ARROW = 37;
        this.RIGHT_ARROW = 39;
        this.H = 72;
        this.L = 76;
        this.Z = 90;
        this.S = 83;
        this.A = 65;
        this.X = 88;
        this.D = 68;
        this.F = 70;
        this.P = 80;
        this.T = 84;
        this.G = 71;
        this.K = 75;
        this.DEL = 46;
        this.ENTER = 13;
        this.ECHAP = 27;
        this.PAGE_UP = 33;
        this.PAGE_DOWN = 34;
        this.QUESTION_MARK = 188;
        this.CTRL = 17;

        this.bindings = {};
        this.ctrlDown = false;

        this.init();
    };

    $.extend(KeyboardController.prototype, {

        init:function () {

            this.bindings[this.LEFT_ARROW] = {event:App.Events.PREVIOUS_CALLED};
            this.bindings[this.RIGHT_ARROW] = {event:App.Events.NEXT_CALLED};
            this.bindings[this.H] = {event:App.Events.HOME_CALLED};
            this.bindings[this.L] = {event:App.Events.LIST_CALLED};
            this.bindings[this.DEL] = {event:App.Events.DELETE_ELEM};
            this.bindings[this.D] = {event:App.Events.DELETIONS_CALLED};
            this.bindings[this.A] = {event:App.Events.ADD_CALLED};
            this.bindings[this.X] = {event:App.Events.CONFIRM_DELS_CALLED, needCtrl:true};
            this.bindings[this.Z] = {event:App.Events.CANCEL_DELS_CALLED, needCtrl:true};
            this.bindings[this.P] = {event:App.Events.PARTICIPANTS_HOME_CALLED};
            this.bindings[this.T] = {event:App.Events.TEAMS_HOME_CALLED};
            this.bindings[this.G] = {event:App.Events.GT_HOME_CALLED};
            this.bindings[this.F] = {event:App.Events.FIND_CALLED};
            this.bindings[this.ENTER] = {event:App.Events.ENTER_CALLED, acceptInputs:true};
            this.bindings[this.ECHAP] = {event:App.Events.ECHAP_CALLED};
            this.bindings[this.PAGE_UP] = {event:App.Events.PAGE_UP_CALLED, acceptInputs:true};
            this.bindings[this.PAGE_DOWN] = {event:App.Events.PAGE_DOWN_CALLED, acceptInputs:true};
            this.bindings[this.QUESTION_MARK] = {event:App.Events.QUESTION_MARK_CALLED};
            this.bindings[this.K] = {event:App.Events.KEYBOARD_CALLED};

            $(document).on("keydown", this.onKeyDown.bind(this));
            $(document).on("keyup", this.onKeyUp.bind(this));
        },

        onKeyDown:function (event) {

            //alert(event.which);
            if (event.which == this.CTRL) {
                this.ctrlDown = true;
            }

            var binding = this.bindings[event.which];

            if (binding && !this.isModalActive()
                && (binding.acceptInputs || !this.targetIsInput(event))
                && (!binding.needCtrl || this.ctrlDown)) {
                PubSub.publish(binding.event, [event]);
            }
        },

        onKeyUp:function (event) {
            if (event.which == this.CTRL) {
                this.ctrlDown = false;
            }
        },

        targetIsInput:function (event) {
            return (typeof event.target !== "undefined" &&
                (event.target.nodeName == "INPUT" ||
                    event.target.nodeName == "TEXTAREA"))
        },

        isModalActive:function () {
            return $(".modal").is(":visible");
        }

    });

    return KeyboardController;
});
