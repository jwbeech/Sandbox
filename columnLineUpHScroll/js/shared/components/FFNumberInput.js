/**
 * Component usage
 * $(selector).ffNumberInput("methodName", argument1, argument2)
 */
shared.components.FormComponent.create("ffNumberInput", {

    _maxLongValue : Math.pow(2,32),
    _minLongValue : -Math.pow(2,32),

    _maxIntegerValue : Math.pow(2,31)-1,
    _minIntegerValue : -Math.pow(2,31),

    _maxPercentValue : Math.pow(2,32)/2-1,
    _minPercentValue : -Math.pow(2,32)/2,

	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/
    getNumberValue : function($element){
        var val = $element.val();
        return (val == "") ? null : Number(val);
    },

    setNumberValue : function($element, value){
        if (value == null) value = "";
        $element.val(value);
    },


	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	_documentReadyListener : function(){
		var self = this;

		$("body").on("keyup", "input[data-formatter='long'], input[data-formatter='integer'], input[data-formatter='percent']", function(e){
			self._applyNumberFormat($(e.target));
		});
	},

	_applyNumberFormat : function ($comp) {
        var formatter = $comp.data().formatter;
        var maxValue, minValue;
        switch (formatter) {
            case "long":
                maxValue = this._maxLongValue;
                minValue = this._minLongValue;
                break;
            case "percent":
                maxValue = this._maxPercentValue;
                minValue = this._minPercentValue;
                break;
            case "integer":
                maxValue = this._maxIntegerValue;
                minValue = this._minIntegerValue;
                break;
        }

		// Repopulate
        var original    = $comp.val();
        var newVal      = this._getOnlyNumbers(original, formatter);
        if (newVal != original) $comp.val(newVal);

        // Check Limits
        var currVal     = Number($comp.val());
        if (currVal > maxValue) {
            $comp.val(maxValue);
        }
        else if (currVal < minValue) {
            $comp.val(minValue);
        }
	},

	_getOnlyNumbers : function (input, formatter){
		// Remove all non number and - characters
		var regex	= /(^-{1})?([0-9])?/g;
        // Include the . in percent type, the rest need to be whole numbers
        if (formatter == "percent"){
            regex	= /(^-{1})?([0-9]|\.)?/g;
        }
		var matches	= input.match(regex);
		var val		= matches ? matches.join("") : "";
		// Remove any . characters if there is more than one
		while(val.indexOf(".") != val.lastIndexOf(".")){
			val		= val.substr(0, val.lastIndexOf(".")) + val.substr(val.lastIndexOf(".") + 1);
		}
		return val;
	}
});