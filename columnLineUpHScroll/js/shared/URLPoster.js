registerClasspath("shared.URLPoster", {});

/**
 * Utility class used for sending POST requests using a simple url.
 * It works by dynamically creating a form on the page and submitting it.
 */
shared.URLPoster = {

    // PRIVATE PROPERTIES
    _$hiddenForm	: null,

    /**
     * Creates a form with all the url parameters and POSTs it.
     * @param url The url to post to, any GET params will be moved into the form
     * @param additionalParams Optional object containing any additional POST params
     * @param disablePage If true all form elements in the page are disabled, Defaults to true if null.
     */
    post : function(url, additionalParams, disablePage){
        if (!this._$hiddenForm){
            var formId			= "hiddenForm_" + new Date().getTime();
            var formText		= '<form id="' + formId + '" class="displayNone" method="POST"></form>';
            $("body").append(formText);
            this._$hiddenForm	= $("#" + formId);
        }

        if (disablePage == null) disablePage = true;

        // Remove all elements first
        this._$hiddenForm.html("");

        // Lets break up the url
        var parts	= shared.URLBuilder.seperateURL(url);
        var msg		= "Posting to: " + parts.initial + " with params: ";

        // Set the action using the flat url
        this._$hiddenForm.attr("action", parts.initial);

        // Add url form fields
        msg += this._addParams(parts.data);
        // Add link param form fields
        msg += this._addParams(additionalParams);

        // Simply submit the form
        console.log(msg);

        this._$hiddenForm.submit();

        // Disable the page
        if (disablePage) shared.FormUtils.toggleAllComps($("body"), true);
    },

    _addParams : function(params){
        var msg = "";
        if (params){
            for (var name in params){
                this._$hiddenForm.append('<input type="hidden" name="' + name + '" value="' + encodeURIComponent(params[name]) + '">');
                msg += " " + name + ": " + params[name];
            }
        }
        return msg;
    }
};