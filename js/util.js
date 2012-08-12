define([
    'jquery'
], function ($) {

    // global utility methods
    utils = {

        clearValidationErrors:function () {
            $('.control-group').removeClass("error");
            $('.help-inline').empty();
        },

        /**
         * Select an element
         *
         * @param type optional selection type : 'previous' or 'next'. Otherwise or null : 'next'
         */
        selectElement:function ($el, selector, type) {

            // get currently selected element. If no, select the first one
            var $selected = this.findSelected($el, selector);
            if (!$selected || $selected.length == 0) {
                this.selectFirst($el, selector);
                return;
            }

            // get the element to select and, if any, select it and give it focus
            var $toSelect = (type == 'previous') ? this.findPreviousSelect($selected, selector) : this.findNextSelect($selected, selector);

            $selected.removeClass("selected");

            if (!$toSelect || $selected.length == 0) {

                switch (type) {
                    case 'previous':
                        this.selectFirst($el, selector);
                        return;
                    case 'next':
                        $toSelect = $selected;
                }
            }

            $toSelect.addClass("selected");
            $('*:focus').blur();
            $toSelect.find("a").focus();

        },

        selectNext:function ($el, selector) {
            this.selectElement($el, selector, "next");
        },

        selectPrevious:function ($el, selector) {
            this.selectElement($el, selector, "previous");
        },

        selectFirst:function ($el, selector) {
            var $toselect = $el.find(selector + ":first-child");

            if ($toselect.hasClass("disabled")) {
                $toselect = this.findNextSelect($toselect, selector);
            }

            // select the element, remove focus from others and give it focus
            if ($toselect && $toselect.length != 0) {
                $('*:focus').blur();
                $toselect.addClass("selected").focus();
            }
        },

        findSelected:function ($el, selector) {
            return $el.find(selector + ".selected");
        },

        /**
         * @return {*} the first element after the currently selected one
         */
        findNextSelect:function ($el, selector) {
            var $next = $($el.get(0).nextElementSibling);
            if ($next && $next.length != 0) {
                if ($next.hasClass("disabled")) {
                    return this.findNextSelect($next, selector);
                }
                else {
                    return $next;
                }
            }
            return null;
        },

        /**
         * @return {*} the first element before the currently selected one
         */
        findPreviousSelect:function ($el, selector) {
            var $previous = $($el.get(0).previousElementSibling);
            if ($previous && $previous.length != 0) {
                if ($previous.hasClass("disabled")) {
                    return this.findPreviousSelect($previous, selector);
                }
                else {
                    return $previous;
                }
            }
            return null;
        },

        isValidPageNumber:function (value) {
            if (value.length == 0) {
                return false;
            }

            var intValue = parseInt(value);
            if (isNaN(intValue)) {
                return false;
            }

            return (intValue <= 0);
        }

    };
});