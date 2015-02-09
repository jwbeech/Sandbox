registerClasspath("shared.URLBuilder", {});


/**
 * Class is used as a data store for GET url variables.
 * It also contains methods to parsing urls and appending data
 */
shared.URLBuilder = RootClass.extend(
	{

		// PRIVATE PROPERTIES
		_data		: null,

		/*---------------------------------------------+
		| PUBLIC METHODS					           |
		+---------------------------------------------*/
		initialize : function() {
			this._data = {};
		},

		/**
		 * Pulls out the url's data and stores it
		 * @param url {String} The url to inspect
		 */
		storeURLData : function(url){
			var parts	= shared.URLBuilder.seperateURL(url);
			if (parts && parts.data){
				this._data	= _.extend(this._data, parts.data);
			}
		},

		/**
		 * Simply adds the data entries to the data store
		 * @param data {Object} The data object parameters to add
		 */
		storeRawData : function(data){
			// Add non null params
			if (data) {
				for (var propName in data){
					var val = data[propName];
					if (val && val != "") this._data[propName] = val;
				}
			}
		},

		storeRawEntry : function(key, value){
			// Add non null params
			if (key && value)  this._data[key] = value;
		},

		/**
		 * Takes a given url, adds the stored data properties and returns it
		 * @param url {String} The URL to update
         * @param additionalData {Object} Optional. Any additional data properties that need to be added to the url. These will not override any of the existing properties.
		 * @returns {String} The built url
		 */
		addDataToURL : function(url, additionalData){
			var parts		= shared.URLBuilder.seperateURL(url, true);
			if (parts.data){
				// A few important things here, the order and the blank object we don't want to override the original
				parts.data	= _.extend({}, this._data, parts.data);
			}
			else{
				parts.data	= this._data;
			}
            if (additionalData != null){
                parts.data  = _.extend({}, additionalData, parts.data);
            }
			return shared.URLBuilder.rebuildURL(parts);
		}
	},

	{

		/*---------------------------------------------+
		| STATIC PUBLIC METHODS	 					   |
		+---------------------------------------------*/
        /**
         * This takes the passed in URL and breaks it up into useable parts and returns an object with the following properties:
         *
         * Given an example url (http://www.google.com?search=test&nullParam=#/anchor1), the properties will be
         * url      - This is the original url for convenience - http://www.google.com?search=test&nullParam=#/anchor1
         * initial  - This is the first bit before the query string - http://www.google.com
         * data     - This is a javascript object with all the non null query params - {search:"test"}
         * anchor   - This is the anchor section of the url - #/anchor1
         *
         * @param url {String} The url to break up
         * @param includeNullData {Boolean} Defaults to false but if true will return null data values from the URL
         */
		seperateURL : function(url, includeNullData){
			var initial, data, anchor;

			if (url){
				// Build first bit
				initial = url;
				if (initial.indexOf("?") != -1){
					initial = initial.substr(0, initial.indexOf("?"));
				}
				if (initial.indexOf("#") != -1){
					initial = initial.substr(0, initial.indexOf("#"));
				}

				// Build anchor
				if (url.indexOf("#") != -1){
					anchor = url.substr(url.indexOf("#"));
				}
				// Now pull out the data
				if (url.indexOf("?") != -1 && url.length > url.indexOf("?") + 1){
					// get the variable part
					var dataPart = url.substr(url.indexOf("?") + 1);
					// Remove the anchor part
					if (dataPart.indexOf("#") != -1){
						dataPart = dataPart.substr(0, dataPart.indexOf("#"));
					}
					// Now split and add to the data
					var splitParts	= dataPart.split("&");
					splitParts		= (splitParts || dataPart);
					data			= {};
					_.each(splitParts, function(nameVar){
						if (nameVar != ""){
							if (nameVar.indexOf("=") != -1){
								var varSplit = nameVar.split("=");
								// Strip out empty string or null values
								if (varSplit[1] != "" && varSplit[1] != "null"){
									data[varSplit[0]] = varSplit[1];
								}
                                // Only add null values if asked for
                                else if (includeNullData === true){
                                    data[varSplit[0]] = null;
                                }
							}
							// Only add null values if asked for
							else if (includeNullData === true){
								data[nameVar] = null;
							}
						}
					}, this);
				}
			}
			return {url:url, initial:initial, data:data, anchor:anchor};
		},

        /**
         * This rebuilds a url with the results from seperateURL.
         * The idea is seperateURL can be used, data then added and rebuilt using this method
         *
         * @param parts {Object} the object returned from the seperateURL call
         * @param includeNullData {Boolean} Defaults to false but if true will inject null data values into the url
         *
         * @returns {String} The rebuilt URL
         */
		rebuildURL : function(parts, includeNullData){
			var url		= parts.initial;
			if (parts.data){
				var dataStr = "";
				for (var paramName in parts.data){
                    var value = parts.data[paramName];
                    if (value != null || (value == null && includeNullData === true)){
                        if (dataStr == ""){
                            dataStr	+= "?";
                        }
                        else{
                            dataStr	+= "&";
                        }
                        dataStr		+= paramName + "=" + ((value != null) ? value : "");
                    }
				}
				url += dataStr;
			}
			if (parts.anchor){
				url += parts.anchor;
			}
			return url;
		},

        /**
         * Takes a given url, adds the passed in data then returns it
         * @param url {String} The URL to update
         * @param data {Object} An object of parameter to add to the URL
         * @returns {String} The built url
         */
        addDataToURL : function(url, data){
            var parts   = this.seperateURL(url);
            parts.data  = _.extend((parts.data || {}), data);
            return shared.URLBuilder.rebuildURL(parts);
        }

	}
);