define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap-dropdown',
    'text!templates/header.html',
    'pubsub'
], function ($, _, Backbone, bdd, headerTemplate, Pubsub) {

    var headerView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:_.template(headerTemplate),

        events:{
            "click div":"menuClicked",
            "click .navbar-search .dropdown-menu li a":"toggleSearchOption"

        },

        searchOptions: {
            participants:true,
            teams:true,
            tournaments:true
        },

        initialize:function (el) {
            this.setElement(el);
            this.render();
        },

        render:function () {
            this.$el.html(this.template());
        },

        selectMenuItem:function (menuItem) {
            $('.nav li').removeClass('active');
            if (menuItem) {
                $('.' + menuItem).addClass('active');
            }
        },

        setMenu:function (MenuView) {
            if (this.menuView)
                this.menuView.close();
            this.menuView = new MenuView();
            $('#actions-menu').html(this.menuView.render().el);
        },

        clearMenu:function () {
            if (this.menuView)
                this.menuView.close();
            $('#actions-menu').html("&nbsp;").css("width", "189px");
        },

        menuClicked:function () {
            Pubsub.publish(Events.REMOVE_ALERT);
        },

        toggleSearchOption:function (event) {
            event.stopPropagation();
            event.preventDefault();
            var $target = $(event.currentTarget);
            var $checkbox = $target.find(".search-include");
            this.toggleCheckBox($checkbox);
            this.searchOptions[$target.attr('id')] = !this.searchOptions[$target.attr('id')];
        },

        toggleCheckBox:function ($checkbox) {
            $checkbox.toggleClass("icon-checked");
            $checkbox.toggleClass("icon-unchecked");
        }

    });
    return headerView;
});