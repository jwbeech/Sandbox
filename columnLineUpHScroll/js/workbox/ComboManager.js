registerClasspath("workbox.ComboManager", {});

/**
 * Utility class for managing linked comboboxes and loading the required data
 */
workbox.ComboManager = {
	/**
	 * Sets up the linked combo boxes. Data required is an array of objects with 2 properties, selector & childURL (not required for last item)
	 */
	setupLinkedCombos : function(comboList){
		_.each(comboList, function(data, i) {
            shared.FormUtils.listenToSelectChange($(data.selector), $.proxy(this._handleComboChange, this, i, comboList));
		}, this);
	},

	/**
	 * Listener for the combo changes
	 */
	_handleComboChange : function(index, comboList, e){
		var data	= comboList[index];
		var $combo	= $(data.selector);
		// Clear out all of the children
		console.log("Clearing out lower combos");
		var i		= index + 1;
		while(i < comboList.length){
			$(comboList[i].selector).html("");
			i++;
		}

		// null == please select so if its not that then fetch the data
        var currentValue = $combo.val();
		if (currentValue != null && currentValue != "" && currentValue != "null" && data.hasOwnProperty("childURL")){
			console.log("Fetching new data");
			var nextCB      = (comboList[index + 1]);
            var optionValue = nextCB.optionValue || "name";
            $(nextCB.selector).populateLoading(Locale.get("global.loading")).prop('disabled', true);
			$.ajax({
				url		: data.childURL.replace("__id__", currentValue),
				success	: function(json){
					if (json.data){
						// Populate the options and store the array against the component
						var $combo = $(comboList[index + 1].selector);
                        $combo.populateOptions(json.data, "id", optionValue).prop('disabled', false);
					}
				}
			})
		}
	}
};