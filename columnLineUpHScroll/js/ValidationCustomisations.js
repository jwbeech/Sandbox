$(function(){
    /*
    ----------------------------------------------------------------------------------------------------------------------
    NOTE: All locale is injected in the /templates/jsi18n template, please add locale entries in there for any new methods
    ----------------------------------------------------------------------------------------------------------------------
    */


    /*---------------------------------------------+
    | ADDITIONAL VALIDATION METHODS		 	       |
    +---------------------------------------------*/
    $.validator.addMethod("nullCheck", function (value, element, param) {
        return (value && value != "null");
    });

    $.validator.addMethod("alphaNumeric", function(value, element, param) {
        return this.optional(element) || /^[A-Za-z\d_ \u00C0-\u017F \-]*$/i.test(value);
    });

    $.validator.addMethod("numbersOnly", function(value, element, param) {
        return this.optional(element) || /^[0-9]+$/.test(value);
    });

    $.validator.addMethod("nameValidation", function(value, element, param) {
        // Basically alphaNumeric without the numbers and underscore
        return this.optional(element) || /^[A-Za-z \u00C0-\u017F \-'`]*$/i.test(value);
    });

    $.validator.addMethod("mustBeInPast", function(value, element, param) {
        var dateVal = $(element).ffDateInput("getDateValue");
        var now     = _.beginDate(new Date());
        return this.optional(element) || dateVal == null || dateVal.getTime() < now.getTime();
    });

    $.validator.addMethod("mustBeInPastOrToday", function(value, element, param) {
        var dateVal = $(element).ffDateInput("getDateValue");
        var now     = _.beginDate(new Date());
        now.setDate(now.getDate() + 1);
        return this.optional(element) || dateVal == null || dateVal.getTime() < now.getTime();
    });

    $.validator.addMethod("mustBeInFutureOrToday", function(value, element, param) {
        var dateVal = $(element).ffDateInput("getDateValue");
        var now     = _.endDate(new Date());
        now.setDate(now.getDate() - 1);
        return this.optional(element) || dateVal == null || dateVal.getTime() > now.getTime();
    });

    $.validator.addMethod(
        "minCurrency",
        function(value, element, param){
            var cents   = $(element).ffCurrencyInput("getCentsValue");
            return (this.optional(element) || (cents != null && cents >= param));
        },
        function(param){
            var message = $.validator.messages._minCurrency;
            return $.validator.format(message)(shared.UnitConverter.centsToCurrency(param));
        }
    );

    $.validator.addMethod(
        "maxCurrency",
        function(value, element, param){
            var cents = $(element).ffCurrencyInput("getCentsValue");
            return (this.optional(element) || (cents != null && cents <= param));
        },
        function(param){
            var message = $.validator.messages._maxCurrency;
            return $.validator.format(message)(shared.UnitConverter.centsToCurrency(param));
        }
    );

    $.validator.addMethod(
        "exactCurrency",
        function(value, element, param){
            var cents = $(element).ffCurrencyInput("getCentsValue");
            return (this.optional(element) || (cents != null && cents == param));
        },
        function(param){
            var message = $.validator.messages._exactCurrency;
            return $.validator.format(message)(shared.UnitConverter.centsToCurrency(param));
        }
    );



    $.validator.addMethod(
        "minPercent",
        function(value, element, param){
            var percent = $(element).ffPercentInput("getPercentValue");
            return (this.optional(element) || (percent != null && percent >= param));
        },
        function(param){
            var message = $.validator.messages._minPercent;
            return $.validator.format(message)(shared.UnitConverter.decimalToPercent(param));
        }
    );
    $.validator.addMethod(
        "maxPercent",
        function(value, element, param){
            var percent = $(element).ffPercentInput("getPercentValue");
            return (this.optional(element) || (percent != null && percent <= param));
        },
        function(param){
            var message = $.validator.messages._maxPercent;
            return $.validator.format(message)(shared.UnitConverter.decimalToPercent(param));
        }
    );


    /*---------------------------------------------+
    | HELPERS								       |
    +---------------------------------------------*/
    $.validator.addMethod("ageRestricted", function(value, element, param) {
        var limit		= new Date();
        limit.setFullYear(limit.getFullYear()-18);
        var selectedDate = $(element).ffDateInput("getDateValue");
        return this.optional(element) || (selectedDate && selectedDate < limit);
    });

    /*---------------------------------------------+
    | CHECKLISTS							       |
    +---------------------------------------------*/
    $.validator.addMethod("documentRequired", function(value, element, param) {
        return (value != "" && value != null);
    });
    $.validator.addMethod("documentUploadRequired", function(value, element, param) {
        return (value != "_documentwaiting_");
    });
    $.validator.addMethod("approvalRequired", function(value, element, param) {
        var result = (value != "" && value != null);
        return result;
    });
    $.validator.addMethod("approvalReasonRequired", function(value, element, param) {
        return (value != "_noreasonset_");
    });

});