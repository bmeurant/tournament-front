define([
    'underscore',
    'backbone',
    'hbs!templates/help/shortcuts.html',
    'hbs!templates/help/shortcuts/global.html',
    'pubsub',
    'bootstrap'
], function(_, Backbone, shortcutsTemplate, globalTemplate, Pubsub) {

    var ShortcutsTemplate = Backbone.View.extend({

        template: shortcutsTemplate,

        events: {
            'keydown': 'modalKeydown'
        },

        initialize: function() {
            // in this specific case we can add container as el because we will never close or review this view
            Pubsub.on(App.Events.KEYBOARD_CALLED, this.render, this);
            Pubsub.on(App.Events.VIEW_CHANGED, this.viewChanged, this);
            Pubsub.on(App.Events.ECHAP_CALLED, this.hide, this);
        },

        render: function() {

            var elemTypeStr = _.str.capitalize(this.elemType);
            var viewTypeStr = _.str.capitalize(this.viewType);

            ShortcutsTemplate.__super__.render.apply(this, [{elemType: elemTypeStr, viewType: viewTypeStr}]);

            this.$('.global-shortcuts > .shortcuts').html(globalTemplate());

            require(['hbs!templates/help/shortcuts/' + this.elemType + '/' + this.viewType + '.html'],
                function(specificTemplate) {
                    specificTemplate = specificTemplate({elemType: elemTypeStr, viewType: viewTypeStr});
                    if (specificTemplate.indexOf('404') == -1) {
                        this.$('.specific-shortcuts > .shortcuts').html(specificTemplate);
                    }
                }.bind(this));

            this.$root.modal('show');
            return this;
        },

        modalKeydown: function(event) {
            event.stopPropagation();
            event.preventDefault();
        },

        viewChanged: function(elemType, viewType) {
            this.elemType = elemType;
            this.viewType = viewType;
        },

        hide: function () {
            this.$el.modal('hide');
        }
    });

    return ShortcutsTemplate;
});