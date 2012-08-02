define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap-dropdown',
    'text!templates/header.html',
    'views/deletions/menu',
    'views/search/menu',
    'pubsub'
], function ($, _, Backbone, bdd, headerTemplate, DeletionsMenuView,  SearchMenuView, Pubsub) {

    var headerView = Backbone.View.extend({

        // Cache the template function for a single item.
        template:_.template(headerTemplate),

        events:{
            "click div":"menuClicked",
            "click .navbar-search .dropdown-menu li a":"toggleSearchOption"

        },

        handlers:[],

        searchOptions:{
            participants:true,
            teams:true,
            tournaments:true
        },

        initialize:function (el) {
            this.setElement(el);

            this.handlers.push(Pubsub.subscribe(Events.HOME_CALLED, this.backToGeneralHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PARTICIPANTS_HOME_CALLED, this.moveToParticipantHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.TEAMS_HOME_CALLED, this.moveToTeamsHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.GT_HOME_CALLED, this.moveToGTHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.FIND_CALLED, this.focusOnSearch.bind(this)));

            this.render();

            this.deletionMenu = new DeletionsMenuView($('.element-menu.delete-menu'));
            this.searchMenu = new SearchMenuView($('.search-menu'));
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
            $('.actions-menu').html(this.menuView.render().el);
        },

        clearMenu:function () {
            if (this.menuView)
                this.menuView.close();
            $('.actions-menu').html("&nbsp;").css("width", "189px");
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
        },

        backToGeneralHome:function () {
            window.location.hash = "#";
        },

        moveToParticipantHome:function () {
            window.location.hash = "/participants";
        },

        moveToTeamsHome:function () {
            window.location.hash = "/teams";
        },

        moveToGTHome:function () {
            window.location.hash = "/games";
        },

        focusOnSearch:function (event) {
            event.stopPropagation();
            event.preventDefault();
            $('#searchText').focus();
        }

    });
    return headerView;
});