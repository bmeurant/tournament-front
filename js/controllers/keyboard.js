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

            this.bindings[this.LEFT_ARROW] = this.previous;
            this.bindings[this.RIGHT_ARROW] = this.next;
            this.bindings[this.H] = this.home;
            this.bindings[this.L] = this.list;
            this.bindings[this.DEL] = this.del;
            this.bindings[this.D] = this.deletions;
            this.bindings[this.A] = this.add;
            this.bindings[this.X] = this.confirmDeletions;
            this.bindings[this.Z] = this.cancelDeletions;
            this.bindings[this.P] = this.participants;
            this.bindings[this.T] = this.teams;
            this.bindings[this.G] = this.gamesAndTurnaments;
            this.bindings[this.F] = this.find;
            this.bindings[this.ENTER] = this.enter;
            this.bindings[this.ECHAP] = this.echap;
            this.bindings[this.PAGE_UP] = this.pageUp;
            this.bindings[this.PAGE_DOWN] = this.pageDown;
            this.bindings[this.QUESTION_MARK] = this.questionMark;
            this.bindings[this.K] = this.keyboard;

            $(document).on("keydown", this.onKeyDown.bind(this));
            $(document).on("keyup", this.onKeyUp.bind(this));
        },

        onKeyDown:function (event) {

            //alert(event.which);
            if (event.which == this.CTRL) {
                this.ctrlDown = true;
            }

            if (this.bindings[event.which] && !this.isModalActive()) {
                this.bindings[event.which].apply(this, arguments);
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
        },

        previous:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.PREVIOUS_CALLED, [event]);
            console.log("previous");
        },

        next:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.NEXT_CALLED, [event]);
            console.log("next");
        },

        del:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.DELETE_ELEM, [event]);
        },

        enter:function (event) {
            PubSub.publish(Events.ENTER_CALLED, [event]);
        },

        echap:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.ECHAP_CALLED, [event]);
        },

        home:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.HOME_CALLED, [event]);
        },

        list:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.LIST_CALLED, [event]);
        },

        deletions:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.DELETIONS_CALLED, [event]);
        },

        add:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.ADD_CALLED, [event]);
        },

        confirmDeletions:function (event) {
            if (!this.targetIsInput(event) && this.ctrlDown)
                PubSub.publish(Events.CONFIRM_DELS_CALLED, [event]);
        },

        cancelDeletions:function (event) {
            if (!this.targetIsInput(event) && this.ctrlDown)
                PubSub.publish(Events.CANCEL_DELS_CALLED, [event]);
        },

        participants:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.PARTICIPANTS_HOME_CALLED, [event]);
        },

        teams:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.TEAMS_HOME_CALLED, [event]);
        },

        gamesAndTurnaments:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.GT_HOME_CALLED, [event]);
        },

        find:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.FIND_CALLED, [event]);
        },

        pageUp:function (event) {
            PubSub.publish(Events.PAGE_UP_CALLED, [event]);
        },

        pageDown:function (event) {
            PubSub.publish(Events.PAGE_DOWN_CALLED, [event]);
        },

        questionMark:function (event) {
            if (!this.targetIsInput(event))
                PubSub.publish(Events.QUESTION_MARK_CALLED, [event]);
        },

        keyboard:function (event) {
            PubSub.publish(Events.KEYBOARD_CALLED, [event]);
        }

    });

    return KeyboardController;
});
