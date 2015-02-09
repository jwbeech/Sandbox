registerClasspath("shared.RuntimeURLManager", {});

/**
 * Utility class for updating the URL for sections shown at runtime
 *
 * * Currently only supports client servicing.
 */
shared.RuntimeURLManager = {

    clientSearchURL : null,

    CLIENT_SEARCH   : "clientSearch",
    CLIENT_VIEW     : "clientViewId",

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    /**
     * Checks the URL for any unhandled section changes
     */
    checkForSection : function(){
        var parts       = shared.URLBuilder.seperateURL(window.location.href);
        if (parts.data != null){
            if (parts.data[this.CLIENT_SEARCH]){
                shared.PopupManager.loadAndShowPopup(this.clientSearchURL);
            }
            else if (parts.data[this.CLIENT_VIEW]){
                var clientId = parts.data[this.CLIENT_VIEW];
                // Load client servicing
                var url     = this.clientSearchURL;
                url         = shared.URLBuilder.addDataToURL(url, {clientId:clientId});
                shared.PopupManager.loadAndShowPopup(url);
            }
        }
    },

    /**
     * Changes the URL section
     * @param newSection {String} Section to change to, supported values are constants at the top of the class & null
     * @param sectionData {String} Optional data to go in the URL when required
     */
    changeSection : function(newSection, sectionData){
        if (!this._supported()) return;

        var parts   = shared.URLBuilder.seperateURL(window.location.href);
        parts.data  = parts.data != null ? parts.data : [];

        console.log("Changing section, newSection: ", newSection);

        // Alway clear out all section parameters
        _.each(this._allSectionParams(), function(paramName){
            delete parts.data[paramName];
        });

        // Now add the section parameters
        if (newSection == this.CLIENT_SEARCH){
            parts.data[this.CLIENT_SEARCH] = "true";
        }
        else if (newSection == this.CLIENT_VIEW){
            parts.data[this.CLIENT_VIEW] = sectionData;
        }

        var newURL = shared.URLBuilder.rebuildURL(parts);
        history.pushState({}, null, newURL);
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _supported : function(){
        return _.isFunction(history.pushState);
    },

    _allSectionParams : function(){
        return [this.CLIENT_SEARCH, this.CLIENT_VIEW];
    }
};
