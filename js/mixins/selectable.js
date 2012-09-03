define([
    'jquery'
], function($) {

    return {
        /**
         * Select an element
         *
         * @param type optional selection type : 'previous' or 'next'. Otherwise or null : 'next'
         *
         * @return {*} the newly selected element
         */
        selectElement: function(selector, type) {

            // get currently selected element. If no, select the first one
            var $selected = this.findSelected(selector);
            if (!$selected || $selected.length == 0) {
                return this.selectFirst(selector);
            }

            // get the element to select and, if any, select it and give it focus
            var $toSelect = (type == 'previous') ? this.findPreviousSelect($selected, selector) : this.findNextSelect($selected, selector);

            $selected.removeClass("selected");

            if (!$toSelect || $selected.length == 0) {

                switch (type) {
                    case 'previous':
                        $toSelect = this.selectFirst(selector);
                        break;
                    case 'next':
                        if ($selected.hasClass("disabled")) {
                            $toSelect = this.findPreviousSelect($selected, selector);
                        }
                        else {
                            $toSelect = $selected;
                        }
                }
            }

            $toSelect.addClass("selected");
            this.$('li.thumbnail > a').blur();
            $toSelect.find('a').focus();

            return $toSelect;
        },

        selectNext: function(selector) {
            this.selectElement(selector, "next");
        },

        selectPrevious: function(selector) {
            this.selectElement(selector, "previous");
        },

        selectFirst: function(selector) {
            var $toSelect = this.$(selector + ":first-child");

            if ($toSelect.hasClass("disabled")) {
                $toSelect = this.findNextSelect($toSelect, selector);
            }

            // select the element, remove focus from others and give it focus
            if ($toSelect && $toSelect.length != 0) {
                this.$('li.thumbnail > a').blur();
                $toSelect.find('a').focus();
            }

            return $toSelect;
        },

        selectLast: function(selector) {
            var $toSelect = this.$(selector + ":last-child");

            if ($toSelect.hasClass("disabled")) {
                $toSelect = this.findPreviousSelect($toSelect, selector);
            }

            // select the element, remove focus from others and give it focus
            if ($toSelect && $toSelect.length != 0) {
                this.$('li.thumbnail > a').blur();
                $toSelect.find('a').focus();
            }

            return $toSelect;
        },

        findSelected: function(selector) {
            return this.$(selector + ".selected");
        },

        /**
         * @return {*} the first element after the currently selected one
         */
        findNextSelect: function($el, selector) {
            var $next = this.$($el.get(0).nextElementSibling);
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
        findPreviousSelect: function($el, selector) {
            var $previous = this.$($el.get(0).previousElementSibling);
            if ($previous && $previous.length != 0) {
                if ($previous.hasClass("disabled")) {
                    return this.findPreviousSelect($previous, selector);
                }
                else {
                    return $previous;
                }
            }
            return null;
        }
    };
});