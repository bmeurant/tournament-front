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
            var $toSelect = (type == 'previous') ? this.findPreviousSelect($el, selector) : this.findNextSelect($el, selector);

            if ($toSelect && $toSelect.length > 0) {
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
            return $el.find(selector + ".selected + " + selector);
        },

        /**
         * @return {*} the first element before the currently selected one
         */
        findPreviousSelect:function ($el, selector) {
            var previous = $el.find(selector + ".selected").get(0).previousElementSibling;
            if (previous) {
                return $el.find('#' + previous.id);
            }
            return null;
        }

    };
});