define([], function () {

    return {
        isValidPageNumber:function (value) {
            if (value.length == 0) {
                return false;
            }

            var intValue = parseInt(value);
            if (isNaN(intValue)) {
                return false;
            }

            return (intValue >= 0);
        }
    };
});