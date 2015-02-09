shared.components.FormComponent.create("ffButtonInput", {
    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _componentsAddedToStage : function(e){
        // Fix so comp re-validates
        $(e.target).find("input.form-control.buttonInput").each(function(){
            var $this = $(this);
            if ($this.data("initialized") != true){
                $this.data("initialized", true);

                var toggle = function(e) {
                    e.stopPropagation();
                    var $button = $this.closest("div").find("button");
                    $button.trigger("click");
                    $button.focus();
                };

                $this.on("click", toggle);
            }
        });
    }
});