/**
 * Component usage
 * $(selector).ffAutoPopulateInput("methodName", argument1, argument2)
 */
shared.components.FormComponent.create("ffAutoPopulateInput", {

	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/


	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	_documentReadyListener : function(){
		var self = this;

		$("body").on("keyup", "form input, form select, form textarea", function(e){
			if (e.ctrlKey && e.shiftKey && e.altKey && e.which == 191){ // ctrl + shift + /
                // Find the form element
                var $this	= $(e.target);
                var $parent	= $this.findParentBy(function(item) { return item.prop("tagName") == "FORM"; });
                if ($parent) self._populateFormFields($parent);
			}
		});
	},

	_populateFormFields : function($form){
		$form.find("input:visible, select:visible, textarea:visible").each($.proxy(function(i, item){
			var $this	= $(item);
			var val		= $this.val();

            // Special use case for select2 components
            if ($this.hasClass("select2-focusser") || $this.hasClass("select2-offscreen")) return;

			if (!$this.attr("disabled") && $this.css("display") != "none"){
				if (($this.prop("tagName") == "INPUT" || $this.prop("tagName") == "TEXTAREA") && (val == null || val == "")){
					var df = $this.attr("data-formatter");

					if ($this.attr("type") == "checkbox"){
					}
					else if (df == "currency"){
						$this.ffCurrencyInput("setCentsValue", 50000);
					}
					else if (df == "date"){
						$this.ffDateInput("setDateValue", new Date(1986, 10, 16, 0, 0, 0, 0));
					}
					else if (df == "percent"){
						$this.ffPercentInput("setPercentValue", 0.0175);
					}
					else if (df == "percent" || df == "long" || df == "integer" || $this.attr("data-restrict") == "[0-9]" || $this.attr("data-restrict") == "[0-9]| "){
						$this.val(Math.floor(Math.random() * 10000));
					}
					else{
                        var rules;
                        try{
                            rules = $this.rules();
                        }
                        catch (error) {}

                        if (rules && rules.numbersOnly){
                            if (rules.maxlength){
                                if (rules.minlength == null){
                                    $this.val(this._randomNum(Math.min(10, rules.maxlength)));
                                }
                                else{
                                    $this.val(this._randomNum(rules.maxlength));
                                }
                            }
                            else if (rules.minlength){
                                $this.val(this._randomNum(rules.minlength));
                            }
                            else{
                                console.log(rules);
                                $this.val(this._randomNum(5));
                            }
                        }
                        else{
                            $this.val(_.ipsum(15));
                        }
					}
					$this.trigger("keyup");
					$this.trigger("focusout");
				}
				else if ($this.prop("tagName") == "SELECT"){
					if ($this.prop("selectedIndex") == 0) {
						$this.prop("selectedIndex", 1);
						$this.trigger("focusout");
						$this.trigger("change");
					}
				}
			}
		}, this));
	},

    _randomNum : function(length){
        var nums    = "123456789";
        var result  = "";
        for (var i = 0; i < length; i++){
            result  += _.random(0, nums.length - 1);
        }
        return result;
    }
});