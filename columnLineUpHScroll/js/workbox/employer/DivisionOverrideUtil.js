registerClasspath("workbox.employer.DivisionOverrideUtil", {});

workbox.employer.DivisionOverrideUtil = {

    setupOverrideListener : function($parentCheck, canChange, cantChangeErrorMsg, copyMessage, backToParentMessage, $moduleHolder, changeURL, frm, moduleId){

        $parentCheck.change(function(e){
            var $this   = $(this);
            var checked = $this.prop("checked");

            // If not possible yet
            if (!canChange){
                $this.prop("checked", !checked);
                shared.PopupManager.showValidation(cantChangeErrorMsg);
            }
            // Otherwise confirm with a dialog and clone checkbox
            else{

                function runChange(clone, useParents){
                    console.log("Running parent change. Clone: ", clone, ", Use Parent: ", useParents);

                    // Run this call manually as we don't want a parent update
                    $moduleHolder.trigger(Events.MODULE_POST_START);
                    $.ajax({
                        url     : changeURL,
                        type    : "POST",
                        data    : {data:JSON.stringify({clone:clone, useParents:useParents})},
                        success : function(json){
                            $moduleHolder.trigger(Events.MODULE_POST_END);
                            if (json.html) $moduleHolder.html(json.html);
                            // Manually trigger the reload for in case any other modules need to reload when this one does.... guy~!
                            frm.triggerReloadFors(moduleId);
                        }
                    });
                }

                var checkId = "dialogCheck_" + _.random(0, 999999);
                var msg = [
                    '<label class="checkbox-inline">',
                        '<input type="checkbox" id="' + checkId + '" checked> ' + copyMessage,
                    '</label>'
                ];
                var useMsg = (checked) ? backToParentMessage : msg.join("\r");

                var $modal = shared.PopupManager.showConfirmation(useMsg, function(buttonClicked){
                    if (buttonClicked == shared.PopupManager.BUTTON_YES){
                        // Change parent inheritance
                        var clone = $modal.find("#" + checkId).prop("checked");
                        runChange(clone, checked);
                    }
                    else{
                        $this.prop("checked", !checked);
                    }
                }, Locale.get("modal.button.ok"));
            }
        });
    }
};