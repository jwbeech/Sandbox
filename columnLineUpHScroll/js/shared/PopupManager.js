registerClasspath("shared.PopupManager", {});

shared.PopupManager = {

	homeURL				    : null,

	// CONSTANTS - PLEASE DON'T CHANGE
	BUTTON_OK			    : "ok",
	BUTTON_YES			    : "yes",
	BUTTON_NO			    : "no",
	BUTTON_CANCEL		    : "cancel",

    ACTION_RELOAD           : "actionReload",
    ACTION_HOME_LOAD        : "actionHomeLoad",

    // PRIVATE PROPERTIES
    _dialogHTML             : null,
    _authDialogHTML         : null,
    _documentLanguageDialogHTML : null,

	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/
	/**
	 * Shows the supplied popup
	 * NOTE: All popups must be shown via this method for complete control
	 */
	show : function($modal)
	{
        console.log("Showing modal");

        $modal.one("shown", function(e){
            $modal.css("visibility", "visible");
            $modal.removeClass("fadeOutDown").removeClass("animation300ms");
            $modal.addClass("animated fadeInUp animation500ms");
            setTimeout(function(){ $modal.trigger("popupShown"); }, 500);
        });

        $modal.modal({keyboard:false, show:true, backdrop:"static"});
	},
	/**
	 * Hides the supplied popup
	 * NOTE: All popups must be hidden via this method for complete control
	 */
	hide : function($modal, removeAfter)
	{
		if (removeAfter == null) removeAfter = true;

        $modal.removeClass("animation500ms").removeClass("fadeInUp");
        $modal.addClass("fadeOutDown").addClass("animation300ms");
		setTimeout($.proxy(function(){
			$modal.modal("hide");
			$modal.trigger("popupHidden");
			if (removeAfter) $modal.remove();
		}, this), 300);
	},

    /**
     * Adds button listeners to correctly close a dialog using shared.PopupManager.hide()
     * @param buttonSelectors {String} The jquery selectors for the buttons
     * @param modalSelector {String} The jquery selector for the modal
     * @param closeCallback {Function} The callback to execute on close
     * @param removeAfter {Boolean} if true it removes the dialog after closing, defaults to true
     */
	addCloseListeners : function(buttonSelectors, modalSelector, closeCallback, removeAfter){
		if (closeCallback){
			$(buttonSelectors).click(closeCallback);
		}
		else{
			$(buttonSelectors).click($.proxy(this.hide, this, $(modalSelector), removeAfter));
		}
	},

	/**
	 * Loads an ajax request for popup code, and adds it to the body to be shown
	 * @param url The url to render the popup HTML
	 */
	loadAndShowPopup : function(url){
		$("body").modalmanager('loading');
		$.ajax({
			url		: url,
			method	: "GET",
			success	: $.proxy(function(json){
				if (json.html) {
                    $("#modalHolder noscript").append(json.html);
                    this.show($("#modalHolder noscript > *"));
				}
			}, this)
		});
	},

    /**
     * Shows a confirmation dialog and executes the callback when a button is selected passing the button constant.
     * @param message The message to add to the dialog
     * @param callback The callback to execute on dialog close
     * @param yesLabel Label to use for yes button
     * @param cancelLabel Label to use for no button
     * @returns The jquery element for the modal
     */
    showConfirmation : function(message, callback, yesLabel, cancelLabel){
        var title	= Locale.get("modal.confirmation.title");
        var buttons	= [
            {label:(yesLabel) ? yesLabel : Locale.get("modal.button.yes"), className:"btn-primary", constant:this.BUTTON_YES},
            {label:(cancelLabel) ? cancelLabel : Locale.get("modal.button.cancel"), className:"btn-default", constant:this.BUTTON_CANCEL}
        ];
        return this._addListenersAndShow("confirmation", title, buttons, message, null, callback);
    },

    /**
     * Shows a confirmation dialog and executes the callback if the yes button is selected
     * @param message The message to add to the dialog
     * @param callback The callback to execute on dialog close
     * @param yesLabel Label to use for yes button
     * @param cancelLabel Label to use for no button
     * @returns The jquery element for the modal
     */
    showConfirmationYes : function(message, callback, yesLabel, cancelLabel){
        var title	= Locale.get("modal.confirmation.title");
        var buttons	= [
            {label:(yesLabel) ? yesLabel : Locale.get("modal.button.yes"), className:"btn-primary", constant:this.BUTTON_YES},
            {label:(cancelLabel) ? cancelLabel : Locale.get("modal.button.cancel"), className:"btn-default", constant:this.BUTTON_CANCEL}
        ];
        return this._addListenersAndShow("confirmation", title, buttons, message, null, $.proxy(function(button){
            if (button == this.BUTTON_YES){
                callback();
            }
        }, this));
    },

    /**
     * Shows a confirmation dialog and executes the callback when a button is selected passing the button constant.
     * This is for a three button confirmation with, yes, no and cancel
     * @param message The message to add to the dialog
     * @param callback The callback to execute on dialog close
     * @param yesLabel Label to use for yes button
     * @param noLabel Label to use for no button
     * @param cancelLabel Label to use for no button
     * @returns The jquery element for the modal
     */
    showConfirmationThreeWay : function(message, callback, yesLabel, noLabel, cancelLabel){
        var title	= Locale.get("modal.confirmation.title");
        var buttons	= [
            {label:(yesLabel) ? yesLabel : Locale.get("modal.button.yes"), className:"btn-primary", constant:this.BUTTON_YES},
            {label:(noLabel) ? noLabel : Locale.get("modal.button.no"), className:"btn-primary", constant:this.BUTTON_NO},
            {label:(cancelLabel) ? cancelLabel : Locale.get("modal.button.cancel"), className:"btn-default", constant:this.BUTTON_CANCEL}
        ];
        return this._addListenersAndShow("confirmation", title, buttons, message, null, callback);
    },

    /**
     * Shows an error dialog and executes the callback when a button is selected passing the button constant.
     * Additionally supports debug info that is displayed in a "code more info" section
     *
     * @param message The message to add to the dialog
     * @param debugInfo The code to display in the more info section, traditionally a stack trace
     * @param completeAction The complete action to take, defaults to nothing, options are shared.PopupManager.ACTION_RELOAD, shared.PopupManager.ACTION_HOME_LOAD
     * @param callback The callback to execute on dialog close
     * @returns The jquery element for the modal
     */
    showError : function(message, debugInfo, completeAction, callback){
        var title	= Locale.get("modal.error.title");
        var buttons	= [
            {label:Locale.get("modal.button.ok"), className:"btn-primary", constant:this.BUTTON_OK}
        ];
        if (completeAction == shared.PopupManager.ACTION_RELOAD){
            buttons[0].label = Locale.get("modal.button.refreshPage");
        }
        return this._addListenersAndShow("error", title, buttons, message, debugInfo, callback, completeAction);
    },

    /**
     * Used to show a generic fatal error message for when an ajax call fails.
     * @returns The jquery element for the modal
     */
    showFatalAjaxError : function(debugInfo){
        return this._addListenersAndShow(
            "error",
            Locale.get("modal.error.title"),
            [{label:Locale.get("modal.button.refreshPage"), className:"btn-primary", constant:this.BUTTON_OK}],
            Locale.get("modal.ajaxFatal.error"),
            debugInfo,
            null,
            this.ACTION_RELOAD
        );
    },

    /**
     * Shows a validation error dialog with the passed message
     * @param message The message to add to the dialog
     * @param completeAction The complete action to take, defaults to nothing, options are shared.PopupManager.ACTION_RELOAD, shared.PopupManager.ACTION_HOME_LOAD
     * @param callback The callback to execute on dialog close
     * @param debugInfo Optional debug info
     * @returns The jquery element for the modal
     */
    showValidation : function(message, completeAction, callback, debugInfo){
        var title	= Locale.get("alert.validation.title");
        var buttons	= [
            {label:Locale.get("modal.button.ok"), className:"btn-primary", constant:this.BUTTON_OK}
        ];
        if (completeAction == shared.PopupManager.ACTION_RELOAD){
            buttons[0].label = Locale.get("modal.button.refreshPage");
        }
        return this._addListenersAndShow("validation", title, buttons, message, debugInfo, callback, completeAction);
    },

    /**
     * Shows an information dialog with the passed message
     * @param message The message to add to the dialog
     * @param callback The callback to execute on dialog close
     * @returns The jquery element for the modal
     */
    showInformation : function(message, callback){
        var buttons	= [
            {label:Locale.get("modal.button.ok"), className:"btn-primary", constant:this.BUTTON_OK}
        ];
        return this._addListenersAndShow("info", Locale.get("alert.info.title"), buttons, message, null, callback);
    },

    /**
     * Shows an authentication dialog and adds a "password" property to the ajaxOptions.data and resends the request
     * @param ajaxOptions The original ajax request object
     * @param username The username of the current user
     * @param authFailed If the previous attempt failed
     */
    showAuth : function(ajaxOptions, username, authFailed){
        if (!this._authDialogHTML) this._authDialogHTML = $("#authDialogTemplate").html();
        authFailed      = (authFailed != null) ? authFailed : false;
        var rnd			= (new Date()).getTime();
        var compiled    = _.template(this._authDialogHTML, {id:"modal_" + rnd, authBtn:"authBtn_" + rnd, username:username, authFailed:authFailed});
        $("#modalHolder").append(compiled);

        var $modal      = $("#modal_" + rnd);
        var $password   = $modal.find("input[name=password]");
        var $form       = $modal.find("form");
        $form.validate({rules:{password:{required:true}}});
        shared.FormUtils.listenToSubmit($form, $modal.find("#authBtn_" + rnd), $.proxy(function(e){
            e.preventDefault();
            if ($form.validate().form()){
                ajaxOptions.data            = ajaxOptions.data || {};
                ajaxOptions.data.password   = $password.val();
                this.hide($modal, true);
                $.ajax(ajaxOptions);
            }
        }, this));
        $modal.one("popupShown", function(e){
            $password.focus();
        });
        this.show($modal);
    },

	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	_addListenersAndShow : function(type, title, buttons, message, debugInfo, callback, completeAction){

		// GET html and compile the template
		var rnd			= (new Date()).getTime();
		var uid			= "modal_" + rnd;
        if (!this._dialogHTML) this._dialogHTML = $("#dialogTemplate").html();

		var moreId		= "moreBtn_" + rnd;
		var contentId	= "content_" + rnd;

		// instead of <%= … %> use {{ … }} and instead of <% … %> use {[ … ]}
		var compiled	= _.template(this._dialogHTML, {id:uid, type:type, title:title, buttons:buttons, message:message, debugInfo:debugInfo, moreId:moreId, contentId:contentId});

		// Add, show, add remove listener
		$("#modalHolder").append(compiled);

		// Add button listeners
		$("#" + uid + " button").click($.proxy(function(e){
			this.hide($("#" + uid));
			if (callback) callback($(e.target).attr("data-constant"));
            if (completeAction == this.ACTION_RELOAD){
                window.location.reload()
            }
            else if (completeAction == this.ACTION_HOME_LOAD){
                window.location = this.homeURL;
            }
		}, this));

		// Register more info listener
		var alt = $("#" + moreId).attr("data-alternateText");
		$("#" + moreId).linkShowHide($("#" + contentId), ((alt && alt != "") ? alt : null));

		// Show the actual popup
        var $modal = $("#" + uid);
		this.show($modal);
        return $modal;
	}
};

(function(){

    // Override of method for the modal manager to allow the full loading of popups before displaying
    var originalBackdrop = $.fn.modalmanager.Constructor.prototype.backdrop;

    $.fn.modalmanager.Constructor.prototype.backdrop = function (modal, callback) {
        var showBackdrop    = (modal.options.backdrop && this.backdropCount < this.options.backdropLimit);
        var method          = $.proxy(originalBackdrop, this, modal, callback);

        if (modal.isShown && showBackdrop && modal.$element.attr("data-wait-for-popup-ready") == "true"){
            console.log("Waiting for popup ready");
            modal.$element.one("popupReady", function(){
                console.log("Popup is ready");
                method();
            });
        }
        else{
            console.log("Calling super backdrop method");
            method();
        }
    };

    // Override of method for the modal manager to cancel any removal of modals when clicking outside
    var originalCreateContainer = $.fn.modalmanager.Constructor.prototype.createContainer;
    $.fn.modalmanager.Constructor.prototype.createContainer = function (modal) {
        var method          = $.proxy(originalCreateContainer, this, modal);
        var $container      = method();
        $container.on("click.modalmanager", function(e){
            if ($(e.target).hasClass("modal-scrollable")){
                console.log("Cancelling modal backdrop click.");
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        });
        return $container;
    };


}).call(this);
