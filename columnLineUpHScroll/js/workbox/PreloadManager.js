registerClasspath("workbox.PreloadManager", {});

/**
 * Class for managing the workbox page along with all of its components
 */
workbox.PreloadManager = RootClass.extend(
	{
        // PRIVATE PROPERTIES
		_instanceId		    : null,
		_selectorPrefix	    : null,
		_isPopupContent	    : null,
        _allRootsLoaded     : false,
        _childLoadCount     : 0,
        _moduleDelay        : 50,
        _popupDelay         : 100,
        _moduleShowSpeed    : 700,

		/*---------------------------------------------+
		| PUBLIC METHODS					           |
		+---------------------------------------------*/
		initialize : function(instanceId, selectorPrefix, isPopupContent){
			this._instanceId		= instanceId;
			this._selectorPrefix	= selectorPrefix;
			this._isPopupContent	= isPopupContent;

            var $selector           = $(selectorPrefix);

            if ($selector.length == 0){
                throw new Error("Unable to locale key dom element", selectorPrefix);
            }

			// Add listeners
            $selector.one(Events.ALL_ROOT_MODULES_LOADED,	$.proxy(this._allRootModulesLoadedListener, this));
            $selector.bind(Events.MODULE_POST_START,		$.proxy(this._modulePOSTListener, this));
            $selector.bind(Events.MODULE_POST_END,			$.proxy(this._modulePOSTListener, this));
            $selector.bind(Events.CHILD_MODULE_LOAD_START,	$.proxy(this._childLoadListener, this));
            $selector.bind(Events.CHILD_MODULE_LOAD_END,	$.proxy(this._childLoadListener, this));
		},


		/*----------------------------------------------+
		| PRIVATE METHODS								|
		+----------------------------------------------*/
		/*
		LISTENERS
		--------------------------------------------
		*/
		_allRootModulesLoadedListener : function(e){
            this._allRootsLoaded = true;

            console.log("_allRootModulesLoadedListener ", this._selectorPrefix);

			if (this._isPopupContent){
                setTimeout($.proxy(this._checkCount, this), 100);
			}
			else{
                // Delay the showing of the page to allow for a smooth transition
                setTimeout($.proxy(function(){
                    var $mainHolder         = $(this._selectorPrefix);

                    console.log("Hiding preloader & showing the main container");

                    // Hide the container with opacity and show it
                    $mainHolder.css("opacity", 0).css("visibility", "visible");

                    // Find the main tab pane, set the data-show and alter the height property
                    var $tabPane    = $mainHolder.findParentByClass("tab-pane");
                    $tabPane.attr("data-showing", true);
                    $tabPane.css("overflow", "auto");
                    $tabPane.css("min-height", _.removepx($tabPane.css("height"))).css("height", "");

                    // Hie the preloader and in the holder
                    $mainHolder.parent().find(".tabPreloader").fadeOut(0);

                    // Animate in the module
                    $mainHolder.animate({opacity:1}, this._moduleShowSpeed);

                }, this), this._moduleDelay);
			}
		},

		_modulePOSTListener : function(e){
			var loading			= (e.type == Events.MODULE_POST_START);
			var $sectionHolder	= workbox.PreloadManager._findSectionHolder($(e.target));

			console.log("Setting loading state to: " + loading);
			$sectionHolder.data("loading", loading);
            workbox.PreloadManager._setContentState($sectionHolder, loading);
		},

		_childLoadListener : function(e){
			var $target = $(e.target);
			console.log("Child event listener: " + e.type);
			switch (e.type){
                case Events.CHILD_MODULE_LOAD_START:
                    this._childLoadCount++;
                    console.log("Fading in preloader for: " + $target.attr("id"));
                    $target.find(".modulePreloader").fadeIn(0);
                    break;
				case Events.CHILD_MODULE_LOAD_END:
                    this._childLoadCount--;
					console.log("Fading out preloader for: " + $target.attr("id"));
					$target.find(".modulePreloader").fadeOut(300);
                    var $mc = $target.find(".moduleContent");
                    if ($mc.css("visibility") == "hidden"){
                        // Change the opacity and displaye then trigger
                        $mc.css("opacity", 0).css("visibility", "");
                        $mc.animate({opacity:1}, 600);
                    }
					break;
			}
            this._checkCount();
		},

        _checkCount : function(){
            // Only show the popup after all children have loaded
            if (this._isPopupContent && this._childLoadCount == 0){
                // Execute after the predefined delay
                setTimeout($.proxy(function(){
                    $(this._selectorPrefix).trigger("popupReady");
                }, this), this._popupDelay)

            }
        }
	},


	{
		// STATIC PRIVATE METHODS
		_classRegister : {},

        /*---------------------------------------------+
        | PUBLIC METHODS					           |
        +---------------------------------------------*/
        /*
        STATIC REGISTRATION METHODS
        --------------------------------------------
        */
		createInstance : function(instanceId, selectorPrefix, isPopupContent) {
			var inst = new workbox.PreloadManager(instanceId, selectorPrefix, isPopupContent);
			this._classRegister[instanceId] = inst;
			return inst;
		},

		retrieveInstance : function(instanceId){
			return this._classRegister[instanceId];
		},

		destroyInstance : function(instanceId){
            if (this._classRegister[instanceId]){
                console.log("PreloadManager destroy :", instanceId);
                delete this._classRegister[instanceId];
            }
		},

        /**
         * Updates the components in a module to match its old loading state.
         * For when a module is reloaded from the server while the page is in a loading state
         * @param moduleSelector The jQuery selector for the module holder
         */
        updateModule : function(moduleSelector) {
            var $module         = $(moduleSelector);
            var $sectionHolder	= workbox.PreloadManager._findSectionHolder($module);
            if ($sectionHolder.data("loading") == true){
                workbox.PreloadManager._setContentState($(moduleSelector), true);
            }
        },

        /*---------------------------------------------+
        | PRIVATE STATIC METHODS    				   |
        +---------------------------------------------*/
        _findSectionHolder : function($selector){
            return $selector.findParentBy(function($item) {
                return (($item.attr("id") && $item.attr("id").indexOf("taskHolder_") == 0) || $item.hasClass("modal-dialog"));
            });
        },

        _setContentState : function($section, loading) {
            var time = 300;
            // Show the loaders & hide the buttons
            if (loading){
                $section.find(".footerButtonHolder .buttonLoader").fadeIn(time);
                $section.find(".modal-footer .buttonLoader").fadeIn(time);
            }
            else{
                $section.find(".footerButtonHolder .buttonLoader").fadeOut(time);
                $section.find(".modal-footer .buttonLoader").fadeOut(time);
            }
            shared.FormUtils.toggleAllComps($section, loading);
        }

	}
);

