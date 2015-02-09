(function(){
	var GlobalJSAjaxProxy = RootClass.extend({

        _originalAjax   : null,
        _unloaded       : false,

		/*---------------------------------------------+
		| PUBLIC METHODS					           |
		+---------------------------------------------*/
		initialize : function(){
            var $ = jQuery;
			// Add a global handler to check for ajax based errors
            this._originalAjax  = jQuery.ajax;
            $.ajax              = $.proxy(this._ajaxOverride, this);
            $(document).ajaxError($.proxy(this._ajaxErrorListener, this));

            // Simply sets a boolean indicating the page is being changed, means and aborted ajax queries are not errors
            $(window).on("beforeunload", $.proxy(function(){ this._unloaded = true; }, this));
		},

        /*----------------------------------------------+
        | PRIVATE METHODS								|
        +----------------------------------------------*/
        _handle200Error : function(error){
            var errorType	= error.errorType || "default";
            var msg			= error.message || Locale.get("error.noErrorMsg");
            switch (errorType){
                case "500":
                    shared.PopupManager.showError(msg, error.stackTrace, shared.PopupManager.ACTION_HOME_LOAD);
                    break;
                case "403":
                case "404":
                case "405":
                    shared.PopupManager.showError(msg, null, shared.PopupManager.ACTION_HOME_LOAD);
                    break;
                case "errorReload":
                    shared.PopupManager.showError(msg, null, shared.PopupManager.ACTION_RELOAD);
                    break;
                case "validation":
                    shared.PopupManager.showValidation(msg, null, null, error.stackTrace);
                    break;
                case "validationReload":
                    shared.PopupManager.showValidation(msg, shared.PopupManager.ACTION_RELOAD);
                    break;
                case "validationRedirect":
                    shared.PopupManager.showError(msg, null, null, function(){
                        window.location = error.redirect;
                    });
                    break;
                case "default":
                    shared.PopupManager.showError(Locale.get("error.globalUncaught"), null, shared.PopupManager.ACTION_HOME_LOAD);
                    break;
            }
        },

        /**
         * jQuery override method to bypass the success handler and check things before executing it
         * @private
         */
        _ajaxOverride : function(options){
            options.originalSuccess = options.success;
            options.success         = $.proxy(this._successOverride, this, options);
            return this._originalAjax(options);
        },

        /**
         * The success handler for ALL ajax calls that checks the result for global data responses
         * @private
         */
        _successOverride : function(options, data, textStatus, jqXHR){
            var responseType = jqXHR.getResponseHeader("content-type") || "";
            if (responseType.indexOf("application/json") != -1 && data){
                if (this._checkForAuthFailure(data, textStatus, jqXHR)){
                    if (this._checkForRedirect(data, textStatus, jqXHR)){
                        // Test for authentication requirements
                        if (data.hasOwnProperty("sectionAuthRequired") && data.sectionAuthRequired == true){
                            // Fix the success handler & options
                            options.success = options.originalSuccess;
                            // Call to show the auth dialog
                            shared.PopupManager.showAuth(options, data.username, data.sectionAuthFailed);
                        }
                        else{
                            if (options.originalSuccess != null){
                                options.originalSuccess(data, textStatus, jqXHR);
                            }
                            this._handleUncaughtErrors(data, textStatus, jqXHR);
                        }
                    }
                }
            }
            else if (options.originalSuccess != null){
                options.originalSuccess(data, textStatus, jqXHR);
            }
        },

		/**
		 * Looks for an ajax auth failure if it finds one it reloads the current page forcing a redirect to login and a subsequent redirect back to the starting page.
		 * @private
		 */
		_checkForAuthFailure : function(data, textStatus, jqXHR){
			if (data.hasOwnProperty("authFailed") && data.authFailed){
				window.location.reload();
                return false;
			}
            return true;
		},

		/**
		 * Looks for a direct property in any JSON object an changes the URL
		 * @private
		 */
		_checkForRedirect : function(data, textStatus, jqXHR){
			if (data.hasOwnProperty("redirect")){
                function doReload(){
                    if (data.redirect == "reload"){
                        window.location.reload();
                    }
                    else{
                        window.location = data.redirect;
                    }
                }
                if (data.hasOwnProperty("message")){
                    shared.PopupManager.showInformation(data.message, doReload);
                }
                else{
                    doReload();
                }
                return false;
			}
            return true;
		},

		/**
		 * Handle global errors.
		 * If not handled at the call level this method will catch any errors
		 * To handle at a call level you must just set the XMLHttpRequest.errorHandled to true
		 * @private
		 */
		_handleUncaughtErrors : function(data, textStatus, jqXHR){
			// error property present or passed set to false indicates a failure
			if (!jqXHR.errorHandled && ((data.error != null && !data.hasOwnProperty("passed")) || data.passed == false)){
				if (_.isString(data.error) || data.error == null){
					shared.PopupManager.showError((data.error || Locale.get("error.noErrorMsg")), null, shared.PopupManager.ACTION_HOME_LOAD);
				}
				else{
                    this._handle200Error(data.error);
				}
			}
		},

        /**
         * Global ajax error listener, always shows the fatal error as this is not recoverable.
         */
        _ajaxErrorListener : function(event, jqxhr, settings, thrownError){
            console.log(">>>>> Global Ajax Error Handler");
            console.log("event: ", event);
            console.log("jqxhr: ", jqxhr);
            console.log("settings: ", settings);

            if (this._unloaded || jqxhr.statusText == "abort"){
                // Ignore these errors as we don't care about them
            }
            else{
                console.log("Not deemed aborted request");
                var items = [{name:"readyState", value:jqxhr.readyState}, {name:"status", value:jqxhr.status}, {name:"statusText", value:jqxhr.statusText}];
                var debug = "";
                _.each(items, function(item){
                    if (item.value != "" && item.value != null){
                        debug += item.name + ": " + item.value + "<br />";
                    }
                });
                if (debug == "") debug = null;
                shared.PopupManager.showFatalAjaxError(debug);
            }
        }

	});

	registerClasspath("shared.GlobalJSAjaxProxy", new GlobalJSAjaxProxy());

}).call(this);

