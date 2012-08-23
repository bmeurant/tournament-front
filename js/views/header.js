define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'bootstrap',
    'text!templates/header.html',
    'views/deletions/menu',
    'views/search/menu',
    'views/participants/menu',
    'pubsub'
], function ($, _, Backbone, Handlebars, bdd, headerTemplate, DeletionsMenuView, SearchMenuView, ParticipantsMenuView, Pubsub) {

    return Backbone.View.extend({

        menuElemType:"no",

        // Cache the template function for a single item.
        template:Handlebars.compile(headerTemplate),

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

        initialize:function () {
            this.$el = $("<div>").addClass("navbar").addClass("navbar-inverse").addClass("navbar-fixed-top");
            this.el = this.$el.get(0);

            this.handlers.push(Pubsub.subscribe(App.Events.HOME_CALLED, this.backToGeneralHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.PARTICIPANTS_HOME_CALLED, this.moveToParticipantHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.TEAMS_HOME_CALLED, this.moveToTeamsHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.GT_HOME_CALLED, this.moveToGTHome.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.FIND_CALLED, this.focusOnSearch.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.VIEW_CHANGED, this.onViewChanged.bind(this)));

            this.deletionMenu = new DeletionsMenuView();
            this.searchMenu = new SearchMenuView();

        },

        render:function () {
            this.$el.html(this.template());
            this.deletionMenu.render().$el.appendTo(this.$el.find('.element-menu.delete-menu'));
            this.searchMenu.render().$el.appendTo(this.$el.find('.search-menu'));
            return this;
        },

        selectMenuItem:function (menuItem) {
            this.$el.find('.nav li').removeClass('active');
            if (menuItem) {
                this.$el.find('.' + menuItem).addClass('active');
            }
        },

        setMenu:function (MenuView) {
            if (this.menuView)
                this.menuView.close();
            this.menuView = new MenuView();
            $('.actions-menu').html(this.menuView.el);
        },

        clearMenu:function () {
            if (this.menuView)
                this.menuView.close();
            $('.actions-menu').html("&nbsp;");
        },

        menuClicked:function () {
            Pubsub.publish(App.Events.REMOVE_ALERT);
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
            Backbone.history.navigate("/", true);
        },

        moveToParticipantHome:function () {
            Backbone.history.navigate("/participants", true);
        },

        moveToTeamsHome:function () {
            Backbone.history.navigate("/teams", true);
        },

        moveToGTHome:function () {
            Backbone.history.navigate("/games", true);
        },

        focusOnSearch:function (event) {
            event.stopPropagation();
            event.preventDefault();
            $('#searchText').focus();
        },

        /**
         * Handles main view changed by re-rendering this menu
         *
         * @param elemType type of the element managed by the main view
         * @param viewType main view type
         */
        onViewChanged:function (elemType, viewType) {

            if (this.menuElemType != elemType) {
                this.menuElemType = elemType;
                this.clearMenu();
            }

            switch (elemType) {
                case 'participant':
                    this.setMenu(ParticipantsMenuView);
                    this.selectMenuItem('element-menu');
                    break;
                case 'deletions':
                    this.selectMenuItem('delete-menu');
            }

            if (this.menuView) {
                this.menuView.onViewChanged(elemType, viewType);
            }
        }

    });
});