registerClasspath("clientServicing.accountAdjustment.TransactionLegMirror", {});

clientServicing.accountAdjustment.TransactionLegMirror = {
    handleChanges : function()
    {
        var $body = $("body");
        $body.on("change", "select, input", function (e) {
            var $comp = $(e.target);
            var leg1Comp = $("div[name='" + $comp.attr("name") + "_leg1']");

            if ($comp.is("select")) {
                leg1Comp.text($comp.find("option:selected").text());
            }
            if ($comp.is("input[type='radio']")) {
                var compVal = ($comp.val() == "debit") ? "credit" : "debit";
                leg1Comp = $("input[name='" + $comp.attr("name") + "_leg1'][value='" + compVal + "']");
                leg1Comp.prop("checked", $comp.prop("checked"));
            }
        });
        $body.on("keyup", "input", function(e){
            var $comp = $(e.target);
            var leg1Comp = $("div[name='" + $comp.attr("name") + "_leg1']");

            if ($comp.is("input[type='text']")) {
                if ($comp.is("input[data-formatter='currency']")) {
                    leg1Comp.ffCurrencyInput("setCentsValue", $comp.ffCurrencyInput("getCentsValue", $comp));
                }
                else {
                    leg1Comp.text($comp.val());
                }
            }
        });
    },

    destroy : function()
    {
        $("body").off("change", "select, input").off("keyup", "input");
    }
};