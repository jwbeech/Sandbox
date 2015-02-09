registerClasspath("shared.components.FormComponent", {});

shared.components.FormComponent = {
	create : function(jqueryName, Component){

		if ($.fn.hasOwnProperty(jqueryName)){
			console.error("jQuery function already defined with name " + jqueryName);
			return;
		}

		$.fn[jqueryName] = function(){
			if (arguments.length > 0){
				var args		= [this];
				for (var i = 1; i < arguments.length; i++){
					args.push(arguments[i]);
				}
				if (Component.hasOwnProperty(arguments[0])){
					return Component[arguments[0]].apply(Component, args);
				}
				else{
					console.error("Method " + arguments[0] + " does not exist");
				}
			}
		};

		// Add the body listener to register the currency
		$(function(){
			if (Component.hasOwnProperty("_componentsAddedToStage")){
				$("body").bind("htmlAdded", $.proxy(Component._componentsAddedToStage, Component));
				Component._componentsAddedToStage({target:$("body")[0]});
			}
			if (Component.hasOwnProperty("_documentReadyListener")){
				Component._documentReadyListener();
			}
		});


		if (Component.hasOwnProperty("_init")) Component._init();
	}
};