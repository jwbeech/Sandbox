/**
 * Returns the entire HTML of a selected element
 */
jQuery.fn.outerHTML = function(s) {
	return s ? this.before(s).remove() : jQuery("<p>").append(this.eq(0).clone()).html();
};

/**
 * Adds or remove's a "hidden" class to your dom element
 */
jQuery.fn.setVisible = function(show) {
	if (show == true || show == null){
		this.removeClass("hidden");
	}
	else{
		this.removeClass("hidden").addClass("hidden");
	}
	return this;
};

/**
 * Adds or remove's a class in a single method
 */
jQuery.fn.addRemoveClass = function(className, add) {
	if (className){
		if (add){
			this.addClass(className);
		}
		else {
			this.removeClass(className);
		}
	}
	return this;
};

/**
 * Runs up the parent chain looking for a specific parent
 * @param conditionCallback The function to call to check if the current item is the one you are looking for.
 * @param maxRecursion Optional, defaults to 15. The maximum loop iterations that are made till it exits
 */
jQuery.fn.findParentBy = function(conditionCallback, maxRecursion) {
	if (maxRecursion == null) maxRecursion = 15;
	var retParent;
	if (conditionCallback != null){
		var currParent	= this;
		var cnt			= 0;
		while(currParent && cnt < maxRecursion){
			var result	= conditionCallback(currParent);
			if (result){
				retParent = currParent;
				break;
			}
			else{
				currParent	= currParent.parent();
			}
			cnt++;
		}
	}
	return retParent;
};

/**
 * Uses findParentBy to find by a specific class
 */
jQuery.fn.findParentByClass = function(className, maxRecursion) {
    return this.findParentBy(function(item){ return item.hasClass(className) }, maxRecursion);
};

/**
 * Uses findParentBy to find by a specific tagName
 */
jQuery.fn.findParentByTagName = function(tagName, maxRecursion) {
    tagName = tagName.toUpperCase();
    return this.findParentBy(function(item){ return item.prop("tagName") == tagName }, maxRecursion);
};

/**
 * Links an a tag to show and hide a div, allows for an alternate text to be populated on the toggle
 */
jQuery.fn.linkShowHide = function($related, alternateText) {
	var originalText	= this.html();
	var $this			= this;
	this.click(function(e){
		e.preventDefault();
		if ($related.css("display") == "none"){
			$related.css("display", "block");
			if (alternateText) $this.html(alternateText);
		}
		else{
			$related.css("display", "none");
			$this.html(originalText);
		}
	});
	return this;
};

/**
 * Returns whether or not an ajax call was aborted, this is important for handling error's with ajax calls
 */
jQuery.isAbortedRequest = function(xhr){
    return !xhr.getAllResponseHeaders();
};

/**
 * This overrides the jQuery html method and dispatches an event off the target when content is rendered
 */
$(function(){
	var originalHTMLMethod	= jQuery.fn.html;

	// Define overriding method.
	jQuery.fn.html = function(){
		// Execute the original method.
		var result = originalHTMLMethod.apply(this, arguments);
		if (arguments.length > 0) this.trigger("htmlAdded");
		return result;
	};

	var originalAppend		= jQuery.fn.append;
	// Define overriding method.
	jQuery.fn.append = function(){
		// Execute the original method.
		var result = originalAppend.apply(this, arguments);
		this.trigger("htmlAdded");
		return result;
	};
});


/**
 * Used to generate, at runtime, the options for a select and populate them
 * @param data {Array} The data array
 * @param idProp {String} The name of the property to find the id on. Defaults to "id". Supports dot syntax.
 * @param labelProp {String} The name of the property to find the label on. Defaults to "name". Supports dot syntax.
 * @param enabledProp {String} The name of the property to find enabled on. Defaults to "enabled". If not present defaults to true. Supports dot syntax.
 */
jQuery.fn.populateOptions = function(data, idProp, labelProp, enabledProp){
    var html = "";
    if (data){
        idProp      = (idProp == null) ? "id" : idProp;
        labelProp   = (labelProp == null) ? "name" : labelProp;
        enabledProp = (enabledProp == null) ? "enabled" : enabledProp;
        // First lets separate enabled & disabled items
        var enabled     = [];
        var disabled    = [];
        _.each(data, function(item){
            var isEnabled = _.getOnObject(item, enabledProp);
            if (isEnabled === false){
                disabled.push(item);
            }
            else{
                enabled.push(item);
            }
        });
        _.each(enabled, function(item){
            var id      = _.getOnObject(item, idProp);
            var label   = _.getOnObject(item, labelProp);
            html        += '<option value="' + id + '">' + label + '</option>';
        });
        _.each(disabled, function(item){
            var id      = _.getOnObject(item, idProp);
            var label   = _.getOnObject(item, labelProp);
            html        += '<option value="' + id + '" disabled>' + label + '</option>';
        });
    }
    var $this = $(this);
    $this.html(html);
    $this.data("combo", data);
    return $this;
};

/**
 * Populates a single option in a combo to display loading...
 */
jQuery.fn.populateLoading = function(loadingText){
    var $this = $(this);
    $this.html("<option value=''>" + loadingText + "</option>");
    return $this;
};


/**
 * Utility method, stores an object in a data property of the parent called jsScope
 * This is used to expose a scope of properties and methods to external sources.
 */
jQuery.fn.setParentScope = function(scopeObject){
    var $this   = $(this);
    var $parent = $this.parent();
    if ($parent.length == 0){
        console.error("Unable to store scope, no parent is available");
    }
    else{
        $parent.data("jsScope", scopeObject);
    }
    return $this;
};

/**
 * Returns the jsScope object from the parent.
 */
jQuery.fn.getParentScope = function(){
    var $this   = $(this);
    var $parent = $this.parent();
    if ($parent.length == 0){
        return null;
    }
    else{
        return $parent.data("jsScope");
    }
};

/**
 * Returns the scope for the current html element
 */
jQuery.fn.getScope = function(){
    return $(this).data("jsScope");
};