(function (factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('handlebars'));
    } else if (typeof define === 'function' && define.amd) {
        define(['handlebars'], factory);
    }
}(function (Handlebars) {

    /**
     * Register global custom handlebars helpers
     */
    Handlebars.registerHelper('photo_link', function (picture_url) {
        return "http://localhost:3000/api" + picture_url;
    });

    Handlebars.registerHelper('ifinline', function (value, returnVal) {
        return value ? returnVal : '';
    });

    Handlebars.registerHelper('unlessinline', function (value, returnVal) {
        return value ? '' : returnVal;
    });

    Handlebars.registerHelper('ifequalsinline', function (value1, value2, returnVal) {
        return (value1 == value2) ? returnVal : '';
    });

    Handlebars.registerHelper('unlessequalsinline', function (value1, value2, returnVal) {
        return (value1 == value2) ? '' : returnVal;
    });

    Handlebars.registerHelper('ifequals', function (value1, value2, options) {

        if (value1 == value2) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper('unlessequals', function (value1, value2, options) {
        var fn = options.fn;
        options.fn = options.inverse;
        options.inverse = fn;

        return Handlebars.helpers['ifequals'].call(this, value1, value2, options);
    });

    Handlebars.registerHelper('for', function (start, end, options) {
        var fn = options.fn, inverse = options.inverse;
        var isStartValid = (start && !isNaN(parseInt(start)));
        var isEndValid = (end && !isNaN(parseInt(end)));
        var ret = "";

        if (isStartValid && isEndValid && parseInt(start) <= parseInt(end)) {
            for (var i = start; i <= end; i++) {
                ret = ret + fn(i);
            }
        } else {
            ret = inverse(this);
        }

        return ret;
    });
}));