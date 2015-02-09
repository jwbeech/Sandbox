/**
 * Component usage
 * $(selector).ffInput("methodName", argument1, argument2)
 */
shared.components.FormComponent.create("ffInput", {

    _maxChars : 255,

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _documentReadyListener : function() {
        var self = this;
        $("body").on("keyup", "input", function (e) {
            var $this       = $(this);
            var formatter   = $this.data().formatter;
            if (!formatter) {
                var value       = $this.val();
                var valueLength = value.length;
                if (valueLength > self._maxChars) {
                    $this.val(value.slice(0,self._maxChars));
                }
            }
        });
    }
});