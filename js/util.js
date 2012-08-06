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
            args.splice(0,0, this);

            // call constructor and initialize view
            var view = new (Function.prototype.bind.apply (View, args));

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
        }

    };
});