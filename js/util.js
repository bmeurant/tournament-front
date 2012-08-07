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
         * This methods wrap initialization and rendering of main view in order to guarantee
         * that any previous main view is properly closed and unbind.
         *
         * Otherwise events and listeners are raise twice or more and the application becomes unstable
         *
         * @param $selector jquery selector in which the view has to be rendered
         * @param View View to create
         * @param args optional view constructor arguments
         * @return {Object} create View
         */
        showView:function ($selector, View, args) {
            // initialize args if null
            args = args || [];

            // clean previous view
            if (classes.Views.currentView) {
                classes.Views.currentView.close();
            }

            // insertion of this in arguments in order to perform dynamic constructor call
            args.splice(0, 0, this);

            // call constructor and initialize view
            var view = new (Function.prototype.bind.apply(View, args));

            // render view
            $selector.html(view.render().el);

            // replace global accessor of current view
            classes.Views.currentView = view;

            return view;
        },

        /**
         * @param map
         * @return {Number}: number of effective elements in a given map
         */
        mapLength:function (map) {
            var length = 0;
            $.each(map, function (index, value) {
                length += value.length;
            });
            return length;
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
            var $toSelect = (type == 'previous') ? this.findPreviousSelect($el, selector, true) : this.findNextSelect($el, selector, true);

            if (!$toSelect || $selected.length == 0) {
                this.selectFirst($el, selector);
                return;
            }
            else {
                $toSelect.addClass("selected");
                $selected.removeClass("selected");
                $('*:focus').blur();
                $toSelect.focus();
            }

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
        findNextSelect:function ($el, selector, findSelected) {
            var $next;
            if (findSelected) {
                $next = $el.find(selector + ".selected + " + selector);
            }
            else {
                $next = $($el.get(0).nextElementSibling);
            }
            if ($next || $next.length == 0) {
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
        findPreviousSelect:function ($el, selector, findSelected) {
            var $previous;
            if (findSelected) {
                $previous = $($el.find(selector + ".selected").get(0).previousElementSibling);
            }
            else {
                $previous = $($el.get(0).previousElementSibling);
            }
            if ($previous || $previous.length == 0) {
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

            if (intValue <= 0) {
                return false;
            }
            return true;
        }

    };
})
;