shared.plugins.PluginBuilder.generatePlugin("dataLink", {
    _handleDataLink : function(e){
        if (!e.isDefaultPrevented() && this.$el.attr("data-url") != null){
            e.preventDefault();
            window.location = this.$el.attr("data-url");
        }
    }
}, null, "click", "button.dataLink", "_handleDataLink");