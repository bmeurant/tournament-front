define([
    'jquery',
    'backbone',
    'pubsub'
], function ($, Backbone, Pubsub) {

    /**
     * Global controller allowing to map and publish keyboard events and controls
     */
    return Backbone.View.extend({

        LEFT_ARROW:37,
        RIGHT_ARROW:39,
        H:72,
        L:76,
        Z:90,
        S:83,
        A:65,
        X:88,
        D:68,
        F:70,
        P:80,
        T:84,
        G:71,
        K:75,
        DEL:46,
        ENTER:13,
        ECHAP:27,
        PAGE_UP:33,
        PAGE_DOWN:34,
        QUESTION_MARK:188,
        CTRL:17,

        bindings:{},
        ctrlDown:false,

        events:{
            "keydown":"onKeyDown",
            "keyup":"onKeyUp"
        },

        initialize:function () {

            this.setElement(document);

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
                Pubsub.publish(binding.event, [event]);
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

});
