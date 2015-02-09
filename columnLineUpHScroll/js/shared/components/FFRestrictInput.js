/**
 * Component usage
 * $(selector).ffRestrictInput("methodName", argument1, argument2)
 */
shared.components.FormComponent.create("ffRestrictInput", {
	/*---------------------------------------------+
	| PUBLIC METHODS					           |
	+---------------------------------------------*/

	/*----------------------------------------------+
	| PRIVATE METHODS								|
	+----------------------------------------------*/
	_documentReadyListener : function(){
		$("body").on("keyup", "input[data-restrict]", function(){
			// Build a regexp from the restrict property and remove any characters that don't match
			var $this		= $(this);
			var restrict	= $this.attr("data-restrict");
			var reg			= new RegExp(restrict, "g");
			var matches		= $this.val().match(reg);
			$this.val(matches ? matches.join("") : "");
		});
	}
});