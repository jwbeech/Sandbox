/**
 * Component usage
 * $(element).ffDateInput("methodName", argument1, argument2)
 *
 * e.g:
 * $("#date").ffDateInput("setJSONStringDateValue", "2012-12-31");
 *
 *
 * This component adds additional functionality that enforce these rules:
 * - Pressing enter causes the popup to close & triggers change event
 * - Focus out causes the popup to close & triggers change event
 * - Start date, if set, is used as the starting date for an empty date input instead of today
 * - All change events check if invalid date update the component to null
 * - When a start or end date is set the current date is validated against the new restrictions
 */
shared.components.FormComponent.create("ffDateInput", {

    _timeZoneOffset : null,

	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/
	setupDefaults : function($element, timeZoneOffset){
        $.fn.datetimepicker.defaults.format		        = Locale.get("global.javaScriptDateFormat");
        $.fn.datetimepicker.defaults.useCurrent         = false;
        $.fn.datetimepicker.defaults.keyboardNavigation = false;
        $.fn.datetimepicker.defaults.minDate            = moment({y: 0});
        this._timeZoneOffset                            = timeZoneOffset;
	},

	setDateValue : function($element, newDate){
        // Manual formatting for read only
        if ($element.hasClass("readOnlyLabel")){
            var value = "---";
            if (newDate != null){
                // Only change if actually going to the component
                newDate = this._correctInputDate($element, newDate);
                value = moment(newDate).format($.fn.datetimepicker.defaults.format);
            }
            $element.html(value);
        }
        else{
            var api     = $element.data("DateTimePicker");
            if (api != null){
                // Only change if actually going to the component
                newDate = this._correctInputDate($element, newDate);
                api.setDate(newDate);
            }
            else{
                $element.data("storedDateValue", newDate);
            }
        }
	},

	getDateValue : function($element){
        var api     = $element.data("DateTimePicker");
        if (api == null) return null;
        var moment  = api.getDate();
        var value   = (moment != null) ? moment.toDate() : null;
        value       = value == null || isNaN(value.getDate()) ? null : value;
        if (value != null && !this._isDateTime($element)){
            _.beginDate(value)
        }
        if ($element.val() == ""){
            value   = null;
        }
        value = this._correctOutputDate($element, value);
		return value
	},

    setStartDate : function($element, startDate)
    {
        if (startDate != null && !this._isDateTime($element)){
            startDate = _.beginDate(startDate, true);
        }
        var api = $element.data("DateTimePicker");
        if (api != null){
            // Only change if actually going to the component
            startDate = this._correctInputDate($element, startDate);
            //console.log("Setting start date to: ", startDate);
            api.setMinDate(startDate);

            // If the date value is not currently set
            // set to the start date then null so it uses the start date as a starting place
            if (this.getDateValue($element) == null){
                //console.log("Applying start date for first selection: ", startDate);
                api.setDate(startDate);
                api.setDate(null);
            }
            // Otherwise trigger a change event on the element so the current date is validated against the new start date
            else{
                setTimeout(function() { $element.change(); }, 100);

            }
        }
        else{
            $element.data("storedStartDate", startDate);
        }
    },

    setEndDate : function($element, endDate)
    {
        if (endDate != null && !this._isDateTime($element)){
            endDate = _.endDate(endDate, true);
        }
        var api = $element.data("DateTimePicker");
        if (api != null){
            // Only change if actually going to the component
            endDate = this._correctInputDate($element, endDate);
            api.setMaxDate(endDate);

            // If there is a date set trigger a change event on the element so the current date is validated against the new end date
            if (this.getDateValue($element) != null){
                setTimeout(function() { $element.change(); }, 100);
            }
        }
        else{
            $element.data("storedEndDate", endDate);
        }
    },

	/**
	 * Sets the component's date using the "json format" date: 2010-01-01T05:06:07+0200
	 */
	setJSONStringDateValue : function($element, jsonStringDate){
		if (jsonStringDate && jsonStringDate != ""){
			this.setDateValue($element, moment(jsonStringDate, moment.ISO_8601).toDate())
		}
	},

	/**
	 * Returns the component's date using the "json format": 2010-01-01T05:06:07+02:00 - for time, YYYY-MM-DD - for date only
	 */
	getJSONStringDateValue : function($element){
		var d		= this.getDateValue($element);
		var result	= null;
        if (d != null){
            if (this._isDateTime($element)){
                // ISO 8601 standard format
                result  = moment(d).format("YYYY-MM-DDTHH:mm:ssZ");
            }
            else{
                result  = moment(d).format("YYYY-MM-DD");
            }
        }
		return result;
	},

    destroy : function($element){
        var inst = $element.data("DateTimePicker");
        if (inst != null) inst.destroy();
    },

	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	_componentsAddedToStage : function(e){
		// Fix so comp re-validates
		$(e.target).find("input[data-formatter='date'], input[data-formatter='dateTime']").each($.proxy(function(index, item){
			var $element = $(item);
			if ($element.data("initialized") != true){
				$element.data("initialized", true);
                var formatter       = $element.attr("data-formatter");
                var isDateTime      = this._isDateTime($element);


				if (!$element.hasClass("readOnlyLabel")){

                    // This initializes the date picker for us
                    if (isDateTime){
                        // Override the default format for the time one
                        $element.datetimepicker({format:Locale.get("global.javaScriptDateTimeFormat")});
                    }
                    else{
                        $element.datetimepicker({pickTime: false});
                    }

                    // Add listeners
                    $element.on("keydown", $.proxy(this._keydownListener, this, $element));
                    $element.on("focusout", $.proxy(this._focusoutListener, this, $element));
                    $element.on("dp.change", $.proxy(this._changeListener, this, $element));

                    // Apply any lingering data options set when the comp was not initialised:
                    var storedDateValue = $element.data("storedDateValue");
                    if (storedDateValue != null) this.setDateValue($element, storedDateValue);
                    var storedStartDate = $element.data("storedStartDate");
                    if (storedStartDate != null) this.setStartDate($element, storedStartDate);
                    var storedEndDate = $element.data("storedEndDate");
                    if (storedEndDate != null) this.setEndDate($element, storedEndDate);
				}
			}
		}, this));
	},

    /*
    Listeners
    --------------------------------------------
    */
    _keydownListener : function($element, e){
        // Here we check for the enter key and make sure it doesn't cause a form POST by cancelling the event
        if (e.which == 13){
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // We fetch the current date here, what this does is cause a "set" date in the component
            // This means that there change event fires for components with no value currently set.
            var currentDate = this.getDateValue($element);
            $element.blur();
        }
    },

    _focusoutListener : function($element, e){
        // Here we just need to manually trigger a "change" event on the input field.
        // This causes the component to run the same cycle as if there was a change
        $element.change();
    },

    _changeListener : function($element, e){
        var hasContent  = ($element.val() != "");
        var api         = $element.data("DateTimePicker");

        //console.log("Internal change listener. api.unset: ", api.unset, " hasContent: ", hasContent, ", event: ", e);

        // If there is content in the field and api.unset == true
        // That means the current date is invalid and we need repopulate it with null
        // There could be multiple reasons for api.unset == true, invalid date, out of range, in a disabled date
        // We choose null as it is consistent across all of these
        if (hasContent === true && api.unset === true){
            this.setDateValue($element, null);
        }
    },


    /*
    Utilities
    --------------------------------------------
    */
    _isDateTime : function($element){
        return $element.attr("data-formatter") == "dateTime"
    },

    _correctInputDate : function($element, date){
        if (this._timeZoneOffset == null) throw new Error("timeZoneOffset");
        // Check that the date is not null and we are dealing with a time component otherwise we don't do anything to the dates
        if (date != null && this._isDateTime($element)){
            // we MUST duplicate the date otherwise will have MASSIVE headaches
            date = new Date(date);
            // Now lets get the date to utc
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            // Now lets correct the date to use the pre-configured offset
            date.setMinutes(date.getMinutes() + this._timeZoneOffset);
        }
        return date
    },

    _correctOutputDate : function($element, date){
        if (this._timeZoneOffset == null) throw new Error("timeZoneOffset");
        // Check that the date is not null and we are dealing with a time component otherwise we don't do anything to the dates
        if (date != null && this._isDateTime($element)){
            // we MUST duplicate the date otherwise will have MASSIVE headaches
            date = new Date(date);
            // Now lets correct the date to UTC by decrementing by the pre-configured offset
            date.setMinutes(date.getMinutes() - this._timeZoneOffset);
            // Now lets get move the date from UTC to its local time
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        }
        return date
    }

});