/**
 * Component usage
 * $(element).ffCurrencyInput("methodName", argument1, argument2)
 *
 * e.g:
 * $("#amount").ffCurrencyInput("setCentsValue", 10000);
 */
shared.components.FormComponent.create("ffCurrencyInput", {

	_region : "en-ZA",
    _empty  : "---",
    _maxValue : Math.pow(2,53),
    _minValue : -Math.pow(2,53),

	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/
	setRegion : function($element, newRegion){
		this._region = newRegion;
	},
	getRegion : function($element){
		return this._region;
	},
	setCentsValue : function($element, centsValue){
        if ($element.prop("tagName") == "DIV") {
            // Div is read only
            $element.html((centsValue != null) ? centsValue : this._empty)
        }
        else{
            $element.val(centsValue);
        }
		this._updateCurrencyInputFromCentsValue($element, false);
	},
	getCentsValue : function($element){
        var strVal  = $element.val();
		var value	= $element.asNumber({region:this._region});
        if (strVal === ""){
            value   = null;
        }
        else{

            // Handle NaN and convert to cents please
            value	= isNaN(value) ? null : _.multiplyBy100(value);
        }
		return value;
	},

	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	// Init events and handlers
	_componentsAddedToStage : function(e){
		var self = this;

		$("input[data-formatter='currency'], div[data-formatter='currency']").each($.proxy(function(index, comp){
            var $this = $(comp);
			if ($this.data("initialized") != true){
				$this.data("initialized", true);
				$this.css("text-align", "right");

				$this.focusin(function(e){
					var $this = $(this);
					$this.toNumber({region:self._region});
                    var cents = self.getCentsValue($this);
					if (cents == 0){
						$this.select();
					}
				});

				$this.focusout($.proxy(function(e){
                    var $target     = $(e.target);
                    var currValue   = Number($target.val());
                    if (currValue > this._maxValue) {
                        $target.val(this._maxValue);
                    }
                    else if (currValue < this._minValue) {
                        $target.val(this._minValue);
                    }
                    $target.formatCurrency({region:self._region});
				}, this));

                $this.keyup($.proxy(self._applyNumberFormat, self, $this));

				// Run the initial conversion now
				// If the value results in NaN leave it as is, this could be a population by the browser of an already changed value
				self._updateCurrencyInputFromCentsValue($this, true);
			}
		}, this));
	},

	// Util methods
	_updateCurrencyInputFromCentsValue : function($element, leaveNaN){
		// First / 100
        var strVal  = ($element.prop("tagName") == "DIV") ? $element.html() : $element.val();
		var value   = strVal;
		if (value) value = Number(value);
		if (isNaN(value) && leaveNaN) return;

        // Check for NaN and an empty string, empty string's result in 0 when casted
		if (isNaN(value) || strVal == ""){
			value = "";
		}
		else if (value != 0){
			value = _.divideBy100(value);
		}
		if ($element.prop("tagName") == "DIV"){
            // Div is read only
            if (strVal == this._empty) value = this._empty;
			$element.html(String(value));
		}
		else{
            $element.val(String(value));
		}
        if (value != this._empty) $element.formatCurrency({region:this._region});
	},

    _applyNumberFormat : function ($comp) {
        // Repopulate
        var original    = $comp.val();
        var newVal      = this._getOnlyNumbers(original);
        if (newVal != original) $comp.val(newVal);
    },

    _getOnlyNumbers : function (input){
        // Remove all non number and . characters
        var separator   = $.formatCurrency.regions[this._region].decimalSymbol;
        var regex	    = new RegExp("(^-{1})?([0-9]|\\" + separator + ")?", "g");
        var matches     = input.match(regex);
        var val		    = matches ? matches.join("") : "";
        // Remove any separator characters if there is more than one
        while(val.indexOf(separator) != val.lastIndexOf(separator)){
            val		= val.substr(0, val.lastIndexOf(separator)) + val.substr(val.lastIndexOf(separator) + 1);
        }
        return val;
    }
});