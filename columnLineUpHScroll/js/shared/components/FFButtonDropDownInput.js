shared.components.FormComponent.create("ffButtonDropDownInput", {
    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _componentsAddedToStage : function(e){
        // Fix so comp re-validates
        $(e.target).find("input.form-control.buttonDropDownInput").each(function(){
            var $this = $(this);
            if ($this.data("initialized") != true){
                $this.data("initialized", true);

                var toggle = function(e) {
                    e.stopPropagation();
                    $this.closest("div").find("button").dropdown('toggle');
                };

                $this.on("click", toggle);
            }
        });
    }
});