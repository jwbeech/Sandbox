registerClasspath("shared.EventHandler", {});

/**
 * Utility class for handling reused event types
 */
shared.EventHandler = {

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    /**
     * Handles showing of a popup
     * @param selector {String} The jquery selector for the target
     * @param frm {ModuleRequestFramework} An instance of the module request framework
     * @param moduleId {String} The current moduleId
     * @param url {String} optional, if not populated it is pulled from the e.currentTarget from either href or data-url
     */
    handlePopup : function(selector, frm, moduleId, url){
        $(selector).on("click", $.proxy(this._handlePopup, this, frm, moduleId, url));
    },
    /**
     * Handles showing of a popup using a delegated listener
     * @param parentSelector {String} The parent selector for the delegated event
     * @param selector {String} The jquery selector for the target
     * @param frm {ModuleRequestFramework} An instance of the module request framework
     * @param moduleId {String} The current moduleId
     * @param url {String} optional, if not populated it is pulled from the e.currentTarget from either href or data-url
     */
    handlePopupDelegated : function(parentSelector, selector, frm, moduleId, url){
        $(parentSelector).on("click", selector, $.proxy(this._handlePopup, this, frm, moduleId, url));
    },

    /**
     * Handles the execution of a confirmed action
     * @param selector {String} The jquery selector for the target
     * @param frm {ModuleRequestFramework} An instance of the module request framework
     * @param moduleId {String} The current moduleId
     * @param confirmationMessage {String} The confirmation message for the user
     * @param url {String} optional, if not populated it is pulled from the e.currentTarget from either href or data-url
     */
    handleConfirm : function(selector, frm, moduleId, confirmationMessage, url){
        $(selector).on("click", $.proxy(this._handleConfirmedDirect, this, confirmationMessage, frm, moduleId, url));
    },
    /**
     * Handles the execution of a confirmed action using a delegated listener
     * @param parentSelector {String} The parent selector for the delegated event
     * @param selector {String} The jquery selector for the target
     * @param frm {ModuleRequestFramework} An instance of the module request framework
     * @param moduleId {String} The current moduleId
     * @param confirmationMessage {String} The confirmation message for the user
     * @param url {String} optional, if not populated it is pulled from the e.currentTarget from either href or data-url
     */
    handleConfirmDelegated : function(parentSelector, selector, frm, moduleId, confirmationMessage, url){
        $(parentSelector).on("click", selector, $.proxy(this._handleConfirmedDirect, this, confirmationMessage, frm, moduleId, url));
    },

    /**
     * Handles the execution of a direct module call
     * @param selector {String} The jquery selector for the target
     * @param frm {ModuleRequestFramework} An instance of the module request framework
     * @param moduleId {String} The current moduleId
     * @param url {String} optional, if not populated it is pulled from the e.currentTarget from either href or data-url
     */
    handleDirect : function(selector, frm, moduleId, url){
        $(selector).on("click", $.proxy(this._handleDirect, this, frm, moduleId, url));
    },

    /**
     * Handles the execution of a direct module call using a delegated listener
     * @param parentSelector {String} The parent selector for the delegated event
     * @param selector {String} The jquery selector for the target
     * @param frm {ModuleRequestFramework} An instance of the module request framework
     * @param moduleId {String} The current moduleId
     * @param url {String} optional, if not populated it is pulled from the e.currentTarget from either href or data-url
     */
    handleDirectDelegated : function(parentSelector, selector, frm, moduleId, url){
        $(parentSelector).on("click", selector, $.proxy(this._handleDirect, this, frm, moduleId, url));
    },



    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _handlePopup : function(frm, moduleId, url, e){
        e.preventDefault();
        // Try fetch from the target
        if (url == null) url = this._fetchURL($(e.target));

        if (url == null || url == "") {
            console.error("Unable to locate the URL for your popup");
        }
        else{
            if (frm != null && moduleId != null){
                url = frm.updateURLForModule(url, moduleId);
            }
            shared.PopupManager.loadAndShowPopup(url);
        }
    },

    _handleConfirmedDirect : function(confirmationMessage, frm, moduleId, url, e){
        e.preventDefault();
        // Try fetch from the target
        if (url == null) url = this._fetchURL($(e.target));

        if (url == null || url == "") {
            console.error("Unable to locate the URL for your confirmed call");
        }
        else{
            shared.PopupManager.showConfirmationYes(confirmationMessage, function(){
                frm.runDirectCall(moduleId, url)
            });
        }
    },

    _handleDirect : function(frm, moduleId, url, e){
        e.preventDefault();
        // Try fetch from the target
        if (url == null) url = this._fetchURL($(e.target));
        if (url == null || url == "") {
            console.error("Unable to locate the URL for your call");
        }
        else{
            frm.runDirectCall(moduleId, url)
        }
    },

    _fetchURL : function($target){
        var url;
        var cnt = 0;
        while (url == null){
            if ($target.prop("tagName") == "A"){
                url = $target.attr("href");
            }
            else if ($target.attr("data-url") != null){
                url = $target.attr("data-url");
            }
            else{
                $target = $target.parent();
            }
            cnt++;
            if (cnt == 20) break;
        }
        return url;
    }
};