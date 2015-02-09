/**
 * Component usage
 * $(element).ffPercentInput("methodName", argument1, argument2)
 *
 * e.g:
 * $("#percent").ffPercentInput("setPercentValue", 0.015);
 */
shared.components.FormComponent.create("ffPercentInput", {


	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/
	/**
	 * Converts the server side percent format (0.15) into user formatted version (15 %) and populates
	 */
	setPercentValue : function($element, percent){
        if (percent == 0 || percent == "0"){
            this._setVal($element, percent);
            this._addPercent($element);
        }
        else if (percent && percent != "" && !isNaN(Number(percent))){
            percent = _.multiplyBy100(percent);
            this._setVal($element, percent);
            this._addPercent($element);
        }
        else{
            this._setVal($element, "");
        }
	},

	/**
	 * Returns the server side percent format (0.15) from user formatted version (15 %)
	 */
	getPercentValue : function($element){
		var value = this._getVal($element);
		if (value){
			value	= Number(value.replace("%", ""));
		}
		if (isNaN(value)){
			value = null;
		}
		else{
			value = _.divideBy100(value);
		}
		return value;
	},

	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	_documentReadyListener : function(){
		var selectors	= "input[data-formatter='percent']";
		var self		= this;
        var $body       = $("body");

        $body.on("focusin", selectors, function(e){
			var $this	= $(this);
			// remove the %
			var val		= $this.val();
			if (val != "") $this.val(val.replace("%", "").replace(" ", ""));
		});

        $body.on("focusout", selectors, function(e){
			self._addPercent($(this));
		});
	},

	// Init events and handlers
	_componentsAddedToStage : function(e){
		var self			= this;

		$("input[data-formatter='percent'], div[data-formatter='percent']").each(function(){
			var $this = $(this);
			if ($this.data("initialized") != true){
				$this.data("initialized", true);

                var val = self._getVal($this);
                // Don't do anything if there is a --- this is for read only's
                if (val == "---") return;

				// Convert the percent value
				if (val != "" && val.indexOf("%") == -1) {
					self.setPercentValue($this, Number(val));
				}

				// Add the percent sign
				self._addPercent($this);
			}
		});
	},

	_addPercent : function ($element) {
		// add the %
		var val		= this._getVal($element);
		if (val != "" && val.indexOf("%") == -1) {
			this._setVal($element, val + " %");
		}
	},

	_getVal : function($element){
		return ($element.prop("tagName") == "DIV") ? $element.html() : $element.val();
	},

	_setVal : function($element, val){
		if ($element.prop("tagName") == "DIV") {
			$element.html(val)
		}
		else{
			$element.val(val);
		}
	}
});