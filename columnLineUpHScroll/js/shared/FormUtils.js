registerClasspath("shared.FormUtils", {});

/**
 * This class is used to manage all form based components as well as form serializing
 */
shared.FormUtils = {

	/**
	 * Toggles the loading state for a section
	 * @param $section The jquery element to target
	 * @param loading If the section is in a loading state or not
	 */
	toggleAllComps : function($section, loading){
		// Disable / enable all buttons
		$section.find("button").attr("disabled", loading);
		$section.find("a").addRemoveClass("disabled", loading);

		$section.find("input, select, textarea").each(function(){
			var $this = $(this);
			if (loading){
				if ($this.data("disabledState") == null){
					$this.data("disabledState", ($this.attr("disabled") || "setButNull"));
				}
				$this.attr("disabled", true);
			}
			else{
				var original = $this.data("disabledState");
				$this.attr("disabled", ((original == null || original == "setButNull") ? false : original) );
			}
		});
	},

	/**
	 * Stores combo data against its related select input
	 */
	registerComboData : function(selectorPrefix, formHash){
		$(selectorPrefix).find("select[name]").each(function(i, item){
			if (formHash[item.name] != null){
				$(item).data("combo", formHash[item.name]);
			}
		});
	},

	/**
	 * Used to pull data from a form into an object, this is used over $.serialize as we can intercept certain types for retrieval formatting
	 * @param formSelector The jQuery selector for the form
	 */
	serialiseForm : function(formSelector){
        var result          = {};
        var self            = this;
        var $formSelector   = $(formSelector);

        $formSelector.each(function(index, item){
            var localResult = form2js(item, ".", false, $.proxy(function(node){
                var $this   = $(node);
                var name    = $this.prop("name");
                if (name && _.isString(name) && name != "") {
                    return {name:name, value:this.serialiseSingleInput($this, $formSelector)};
                }
                return false;
            }, self));

            result          = _.extend(result, localResult);
        });
        return result;
	},

	/**
	 * Serialises a single form input
	 * @param $this The jquery form component element
     * @param $parentHolder The parent form element
	 * @returns {Object} The populated value
	 */
	serialiseSingleInput : function($this, $parentHolder){
		var value;
        if ($parentHolder == null){
            $parentHolder = $this.findParentBy(function($parent) { return ($parent.prop("tagName") == "FORM"); }, 20);
            if ($parentHolder == null){
                $parentHolder = $("body");
            }
        }

        var name    = $this.prop("name");
		if (name && name != ""){
			value		    = $this.val();
			value			= (value == "" || value == "null") ? null : value;
			// Get data in different formats for different components
			if ($this.prop("tagName").toLowerCase() == "input" && $this.attr("data-formatter") != null){
				switch ($this.attr("data-formatter")){
					case "currency":
						value	= $this.ffCurrencyInput("getCentsValue");
						break;
                    case "date":
                    case "dateTime":
						value	= $this.ffDateInput("getJSONStringDateValue");
						break;
					case "percent":
						value	= $this.ffPercentInput("getPercentValue");
						break;
					case "number":
						value	= $this.ffNumberInput("getNumberValue");
						break;
				}
			}
            // Use this data property if its available
            var selectedData = $this.data("selectedFormData");
            if (selectedData != null){
                value = selectedData;
            }
			// Replace with item from the comboHash
			else if ($this.prop("tagName").toLowerCase() == "select" && value){
				// Get the combo options from the jquery data
				var options			= $this.data("combo");
				if (options){
					// Find the selected one
					for (var i = 0; i < options.length; i++){
						if (options[i].id == value){
							value = options[i];
							break;
						}
					}
				}
			}
            else if ($this.attr("type") == "checkbox"){
				value = $this.prop("checked")
			}
            else if ($this.attr("type") == "radio"){
                // Get the root holder then find the selected
                value = $parentHolder.find("input[name=" + $this.attr("name") + "]:checked").val();
			}
		}

		return value;
	},

    /**
     * Utility method for combining 3 listeners for a form submit. form submit, button click, button submit.
     * @param formSelector
     * @param submitSelector
     * @param callback
     */
    listenToSubmit : function(formSelector, submitSelector, callback){
        $(formSelector).submit(function(e){ e.preventDefault(); callback(e); });
        $(submitSelector).submit(function(e){ e.preventDefault(); callback(e); });
        $(submitSelector).click(function(e){ e.preventDefault(); callback(e); });
    },

    /**
     * Utility method for combining 2 listeners on a select, 1 for change 1 for arrow keys up and down
     * @param $select The jQuery element to add the listener to
     * @param callback The function to execute for the event
     */
    listenToSelectChange : function($select, callback){
        $select.change(callback);
        $select.keyup(function(e){
            // Up and down keys, changing the select
            if (e.which == 38 || e.which == 40){
                callback(e);
            }
        });
    },

	/**
	 * Used to destroy unnecessary components
	 * @param holderSelector The selector for the parent item
	 */
	destroyComponents : function(holderSelector){
		// Clear any combo json
		$(holderSelector + " select").each(function(i, item){
			$(item).data("combo", null);
		});
		// Kill any date pickers
		$(holderSelector + " input[data-formatter='date']").each(function(i, item){
			$(item).ffDateInput("destroy");
		});
	},

    /**
     * Utility method to link 2 date inputs so that they can't produce a negative date range.
     * When start changes to less than end, end is set to start
     * When end changes to greater than start, start is set to end
     */
    restrictStartEndDates : function($startDate, $endDate){
        $startDate  = $($startDate);
        $endDate    = $($endDate);
        $startDate.on("dp.change", function(e){
            var start   = $startDate.ffDateInput("getDateValue");
            var end     = $endDate.ffDateInput("getDateValue");
            if (start && end && start.getTime() > end.getTime()){
                $endDate.ffDateInput("setDateValue", start);
            }
        });
        $endDate.on("dp.change", function(e){
            var start   = $startDate.ffDateInput("getDateValue");
            var end     = $endDate.ffDateInput("getDateValue");
            if (start && end && start.getTime() > end.getTime()){
                $startDate.ffDateInput("setDateValue", end);
            }
        });
    },

    clearForm : function($selector){
        $($selector).find("input, textarea, select").each(function(index, item){
            var $item   = $(item);
            var name    = $item.prop("tagName");
            switch (name){
                case "INPUT":
                case "TEXTAREA":
                    $item.val("");
                    break;
                case "SELECT":
                    $item.prop("selectedIndex", 0);
                    break;
            }
        });
    },


    /**
     * Utility method to disable a list of fields when another one is populated.
     * Example: Used for ID type fields in a search forms
     *
     * @param $field {Object} The field to listen to
     * @param otherFieldList {Array} A list of fields to disable when the $field is populated
     * @param linker {OrganisationEmployerLinker} An optional OrganisationEmployerLinker to check when re-enabling organisation / employer fields
     */
    listenToUniqueSearchField : function($field, otherFieldList, linker){
        function checkDisableEnable(e) {
            var disable = $field.val() != "";
            _.each(otherFieldList, function($element) { $element.attr("disabled", disable); });
            if (linker != null){
                if (!linker.getEmployerField().attr("disabled") && linker.getOrganisation() == null){
                    linker.getEmployerField().attr("disabled", true);
                }
            }
        }
        // We only execute in the next thread so other listeners can make their field changes first
        $field.keyup(function() { setTimeout(checkDisableEnable, 10); });
        setTimeout(checkDisableEnable, 10);
    }
};