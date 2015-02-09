_.mixin({
	/**
	 * Used to get a value from a source object using a string based dot syntax notation. i.e. "obj1.person.fistname"
	 * @param source The object to search in
	 * @param identifier The string based dot syntax identifier
	 * @returns {*} The related value
	 */
	getOnObject : function(source, identifier) {
		var retVal	= source;
		if (identifier && identifier != "" && source){
			retVal			= null;
			if (identifier.indexOf(".") != -1){
				var parts	= identifier.split(".");
				retVal		= source;
				var found	= false;
				for (var i = 0; i < parts.length; i++){
					var partName	= parts[i];
					if (!retVal.hasOwnProperty(partName)){
						retVal		= null;
						break;
					}
					retVal			= retVal[partName];
					found			= true;
					if (!retVal) break;
				}
				if (!found) retVal = null;

			}
			else{
				retVal = source[identifier];
			}
		}
		return retVal;
	},

	/**
	 * Used to set a value on a source object using a string based dot syntax notation. i.e. "obj1.person.fistname"
	 * @param source The object to search in
	 * @param identifier The string based dot syntax identifier
	 * @param value The value to set
	 * @param createNullObjects Optional, defaults to true. If false and the object chain doesn't exist at any point the value won't be assigned
	 * @returns {Boolean} If the value was assigned or not
	 */
	setOnObject : function(source, identifier, value, createNullObjects){
		if (createNullObjects == null) createNullObjects = true;

		var assigned;
		if (identifier && identifier != "" && source){
			var parts	= identifier.split(".");
			var currVal	= source;
			for (var i = 0; i < parts.length; i++){
				// Drill down untill the last property name
				if (i < parts.length - 1){
					if (currVal[parts[i]]){
						currVal				= currVal[parts[i]];
					}
					else if (currVal[parts[i]] == null && createNullObjects){
						currVal[parts[i]]	= {};
						currVal				= currVal[parts[i]];
					}
					else{
						break;
					}
				}
				// Assign the value on the last property name
				else{
					currVal[parts[i]]	= value;
					assigned			= true;
				}
			}
		}
		return assigned;
	},

    /**
     * Removes null and empty strings from an array an returns a new array. Empty strings can be kept if you set keepEmptyStrings to true
     * @param sourceArr The array to prune
     * @param keepEmptyStrings If true empty strings will be kept, defaults to false
     * @returns {Array} A new array containing non null items
     */
    arrayNullPrune : function(sourceArr, keepEmptyStrings){
        var retArr;
        if (keepEmptyStrings == null) keepEmptyStrings = false;
        if (sourceArr){
            retArr = [];
            _.each(sourceArr, function(item){
                if (item && (item != "" || (keepEmptyStrings && item == ""))) retArr.push(item);
            }, this);
        }
        return retArr;
    },

	/**
	 * Utility for dividing by 100
	 */
	divideBy100 : function(value){
		var result;

        if (value === 0) {
            result = 0;
        }

		if (value && value != "" && !isNaN(Number(value))){
			result		=  + new Big(value).div(100);
		}
		return result;
	},

    /**
     * Utility for multiplying by 100
     */
    multiplyBy100 : function(value){
        var result;
        if (Number(value) === 0){
            result = 0;
        }
        else if (value && value != "" && !isNaN(Number(value))){
            result = new Big(value).times(100).toString();
        }
        return result;
    },

    /**
     * Concatenates a string to a specific length, showing the start and end
     * @param original The original string to
     * @param maxLength The maximum length of the new string defualts to 10
     * @param elipsis Optional, defaults to ..
     */
    concatenate : function(original, maxLength, elipsis){
        maxLength       = (maxLength == null) ? 10 : maxLength;
        elipsis         = (elipsis == null) ? ".." : elipsis;
        var retStr      = original;
        if (original && original.length > maxLength){
            if (maxLength < elipsis.length) return null;

            var deal    = maxLength - elipsis.length;
            var start   = Math.floor(deal / 2);
            var end     = Math.ceil(deal / 2);
            var str1    = original.substr(0, start);
            var str2    = original.substr(original.length - end);
            retStr      = str1 + elipsis + str2;
        }
        return retStr;
    },

    removepx : function(value){
        var retVal = value
        if (value && String(value) != "" && value.toLowerCase().indexOf("px") != -1){
            var index   = value.toLowerCase().indexOf("px");
            retVal      = value.substr(0, index);
        }
        return retVal
    },

    ipsum : function(length){
        var chars	= "abcdefghijklmnopqrstuvwxyz";
        var ret		= "";
        for (var i = 0; i < length; i++){
            var num	= _.random(0, chars.length - 1);
            ret		+= chars.charAt(num);
        }
        return ret;
    },

    capitaliseFirstLetter : function(string){
        if(string){
            if(string.length == 1){
                return string.charAt(0).toUpperCase();
            }else if(string.length > 1){
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
        }
        return string;
    },

    removeWhiteSpaces : function(string){
        if(string){
            return string.replace(/ /g, '');
        }
        return string;
    },

    getURLParameters : function(url){
        var result = {};
        var searchIndex = url.indexOf("?");
        if (searchIndex == -1 ) return result;
        var sPageURL = url.substring(searchIndex +1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            result[sParameterName[0]] = sParameterName[1];
        }
        return result;
    },

    /**
     * Used to create a hash of items from an array
     * @param idStr A dot syntax identifier to use for the property name on each object. If null the object at the current index is used and null is the value
     * @param sourceArr The array to iterate through and create a hash of
     * @param sourceHash An optional object to use as the starting point for the hash
     * @returns {Object} Always returns a hash, may be empty
     */
    hashify : function(idStr, sourceArr, sourceHash){
        if (sourceHash == null) sourceHash = {};
        if (sourceArr){
            if (idStr == "" || idStr == null){
                _.each(sourceArr, function(item){
                    sourceHash[item] = true;
                });
            }
            else{
                _.each(sourceArr, function(item){
                    var hashProp            = _.getOnObject(item, idStr);
                    sourceHash[hashProp]    = item;
                });
            }
        }
        return sourceHash;
    },

    /**
     * Returns weather or not a hash has items or not. Convenience method
     * @returns {Boolean}
     */
    hashHasItems : function(hash){
        var hasItems = false;
        if (hash != null){
            for (var propName in hash){
                hasItems = true;
                break;
            }
        }
        return hasItems
    },

    /**
     * Replaces string tokens with values passed in.
     * Example string:
     * Hello my name is {0} and I am {1} years old
     * Example values:
     * ["John", "34"]
     */
    replaceTokens : function(sourceStr, values){
        if (sourceStr && values && values.length > 0){
            for (var i = 0; i < values.length; i++){
                sourceStr = sourceStr.replace("{" + i + "}", values[i]);
            }
        }
        return sourceStr
    },

    /**
     * Sets a date's time to 00:00:00:0000
     * @param date {Date} The date object to change
     * @param clone {Boolean} Defaults to false, clones the date if true
     */
    beginDate : function(date, clone){
        if (date){
            if (clone === true) date = new Date(date);
            date.setHours(0, 0, 0, 0);
        }
        return date
    },

    /**
     * Sets a date's time to the end of the day
     * @param date {Date} The date object to change
     * @param clone {Boolean} Defaults to false, clones the date if true
     */
    endDate : function(date, clone){
        if (date){
            if (clone === true) date = new Date(date);
            date.setHours(23, 59, 59, 999);
        }
        return date
    }

});