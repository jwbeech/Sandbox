/**
 * Component usage
 * $(selector).ffPostingLink("methodName", argument1, argument2)
 */
shared.components.FormComponent.create("ffPostingLink", {

	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/
	setLinkParam : function($element, name, value){
		var params = $element.data("linkParams");
		if (params == null){
			params = {};
			$element.data("linkParams", params);
		}
		params[name] = value;
	},

	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	_documentReadyListener : function(){
		// Add listeners for all postingLink's
        $("body").on("click", ".postingLink", $.proxy(this._linkListener, this));
	},

	_linkListener : function(e){
		e.preventDefault();
        var $link	= $(e.target);
        shared.URLPoster.post($link.attr("href"), $link.data("linkParams"));
	}
});