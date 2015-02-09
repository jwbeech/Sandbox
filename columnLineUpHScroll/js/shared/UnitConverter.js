registerClasspath("shared.UnitConverter", {});


shared.UnitConverter = {

    centsToCurrency : function(cents) {
        return this.toCurrency(_.divideBy100(cents))
    },

    toCurrency : function(amount){
        var result = null;
        if (amount != null && !isNaN(amount)){
            var region  = $.fn.ffCurrencyInput("getRegion");
            result      = $('<input type="text" value="' + amount + '">').formatCurrency({region:region}).val();
        }
        return result;
    },

    decimalToPercent : function(decimal){
        var result = null;
        if (decimal != null && !isNaN(decimal)){
            decimal = _.multiplyBy100(decimal);
            result  = decimal + " %";
        }
        return result;
    }
};
