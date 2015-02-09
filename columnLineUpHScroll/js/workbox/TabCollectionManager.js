registerClasspath("workbox.TabCollectionManager", {});


/**
 * This class is designed to manage the loading of tab content for all module systems.
 * It also reloads tabs when there is a change and merges the result with the existing tabs.
 * An instance is created for every tab collection and registered with the tabCollectionId
 */
workbox.TabCollectionManager = RootClass.extend({

		// PRIVATE PROPERTIES
		_loadedTabs			: null,
		_tabCollectionId	: null,
		_selectorPrefix		: null,
		_isWorkbox			: false,
		_requests			: null,

		/*---------------------------------------------+
		| PUBLIC METHODS					           |
		+---------------------------------------------*/
		/**
		 * Initialize function adds code to load the tabs as they are changed to
		 * @param tabCollectionJson The etnire tab collection json
		 * @param selectorPrefix The jquery selector prefix to make selections unique to the tabs
		 */
		initialize : function(tabCollectionJson, selectorPrefix){
			this._loadedTabs		= {};
			this._tabCollectionId	= tabCollectionJson.tabCollectionId;
			this._selectorPrefix	= selectorPrefix;
			this._requests			= [];
			workbox.TabCollectionManager.registerInstance(this._tabCollectionId, this);


			// Handle the tab changing
			this._tabChangeListener();
			$(".workboxTabs a").click($.proxy(this._tabChangeListener, this));

			// Look for the
			$(selectorPrefix).findParentBy($.proxy(function($parent){
				if ($parent.hasClass("appBodyContent")) this._isWorkbox = true;
				return this._isWorkbox;
			}, this), 10);

			// Listen to window resizes and call the resize method
			if (this._isWorkbox){
				var callback = $.proxy(this._windowResizeListener, this);
				$(window).resize(_.debounce(callback, 100));
				callback();
			}
		},

		/**
		 * Reloads new tab HTML - the listener processes it
		 * @param reloadURL The url to load from
         * @param redirectURL The url to go to if there are no tasks returned
		 */
		reloadAndProcessNewTabs : function(reloadURL, redirectURL){
			console.log("Reloaing new tabs using: " + reloadURL);
			var jqxhr = $.ajax({
				url     : reloadURL,
				success : $.proxy(this._processNewTabs, this, redirectURL)
			});
			this._requests.push(jqxhr);
		},

		destroy : function(){
			console.log("TabCollectionManager destroy: ", this._tabCollectionId);
			// Abort all requests stored for this class so there is no lingering executing code
			_.each(this._requests, function(jqxhr) { jqxhr.abort(); });
		},

		/*----------------------------------------------+
		| PRIVATE METHODS								|
		+----------------------------------------------*/
		/**
		 * Listener to manage the loading of content within a tab. This is called when a tab is clicked.
		 * @private
		 */
		_tabChangeListener : function(e){
			if (e) {
				e.preventDefault();
				// Call the tab nav show method
				$(e.target).tab("show");
			}

			var prefix			= this._selectorPrefix;

			// Store the selected index so the server can select it when reloading
			var selectedIndex	= $(prefix + " .workboxTabs li[class='active']").index();
			var uid				= $(prefix + " .workboxTabs li[class='active'] a").attr("href");
			$.cookie("selectedTab_" + this._tabCollectionId, selectedIndex, {path:'/'});

			console.log("tab change to index: ", selectedIndex);

			if (this._loadedTabs[uid] == null){
				this._loadedTabs[uid] = {loaded:false, loading:false};
			}

			// Load the tab if not already loaded boet
			var tabData = this._loadedTabs[uid];
			if (tabData.loaded == false && tabData.loading == false){
				// Find the url in the data attribute of the content holder
				var contentURL	= $(uid).attr("data-contenturl");
				if (contentURL == null) {
					console.error("Tab contentURL is null");
					return;
				}

				console.log("loading tab content with url: ", contentURL);

				// Load the content and place inside
				// Source the holder now as by the time its loaded it may not be the same index.
				var tabHolder	= $($(prefix + " .workboxContentWrapper > div")[selectedIndex]);
				tabData.loading	= true;

				var jqxhr = $.ajax({
					url     : contentURL,
					success : $.proxy(function(json){
						if (json.html){
							// Populate the tab content
							tabData.loading	= false;
							tabData.loaded	= true;

							// Reset the height
							tabHolder.css("min-height", 0);

							tabHolder.append(json.html);

							// Create preload manager instance for the loaded tab
							workbox.PreloadManager.createInstance(this._tabCollectionId + "_" + tabHolder.attr("data-tab-id"), "#" + tabHolder.find("div").attr("id"), false);

							if (this._isWorkbox) this._windowResizeListener();
						}
					}, this)
				});
				this._requests.push(jqxhr);
			}
		},

		/**
		 * This processes new tabs HTML from the server, if no tabs are returned it redirects to
		 * @private
		 */
		_processNewTabs : function(redirectURL, json){
			var prefix			= this._selectorPrefix;


			// Add the tabs to a temp invisible holder so we can iterate through them
			$("body").append('<div id="tempHolder" class="hidden"></div>');
			$("#tempHolder").append(json.html || "");

			// If there are tabs to render
			if ($("#tempHolder .tab-content div").length > 0){
				console.log("Replacing tab content");

				// Now remove the conflicting id's
				$("#tempHolder .nav-tabs").attr("id", "");
				$("#tempHolder .tab-content").attr("id", "");

				// First add any new ones
				var localListener = $.proxy(this._tabChangeListener, this);
				$("#tempHolder .nav-tabs a").each(function(index, value){
					console.log("Found new tab at index: " + index);
					var $this	= $(this);
					var href	= $this.attr("href");
					var id		= href.substr(1);
					if (href != "" && $(prefix + " .workboxTabs a[href='" + href + "']").length == 0){
						var liToAdd			= $this.parent().outerHTML();
						var contentToAdd	= $("#tempHolder .tab-content div[id='" + id + "']").outerHTML();
						$(prefix + " .workboxTabs").append(liToAdd);
						$(prefix + " .workboxContentWrapper").append(contentToAdd);

						// Add the listener for the new tab
						$(prefix + " .workboxTabs a[href='" + href + "']").click(localListener);

						console.log("Adding tab and content as not found on the page: " + href);
					}
				});

				var selectedRemoved	= false;

				// Now remove and old ones
				$(prefix + " .workboxTabs a").each($.proxy(function(index, value){
					var $this	= $(value);
					var href	= $this.attr("href");
					var id		= href.substr(1);

					if (href != "" && $("#tempHolder a[href='" + href + "']").length == 0){
						if ($this.parent().hasClass("active") && !selectedRemoved){
							selectedRemoved = true;
						}
						// Remove the li
						$this.parent().remove();

						// Destroy any components and remove the div
						var selector	= prefix + " .workboxContentWrapper div[id='" + id + "']";
						shared.FormUtils.destroyComponents(selector);
						var tabContent	= $(selector);

						// Do some destroying of tab data and classes
						var tabId		= tabContent.attr("data-tab-id");
						workbox.ModuleRequestFramework.destroyInstance(this._tabCollectionId, tabId);
						workbox.PreloadManager.destroyInstance(this._tabCollectionId + "_" + tabId);
						tabContent.remove();
					}
				}, this));

				// Reselect the first element
				if (selectedRemoved) {
					$(".workboxTabs li:first").addClass("active");
					$(".workboxContentWrapper div:first").addClass("active");
					this._tabChangeListener();
				}

				// Update any odd heights
				if (this._isWorkbox) this._windowResizeListener();

				// Remove the old item
				$("#tempHolder").remove();
			}
			else {
				console.log("Can't replace tab content");
				workbox.TabCollectionManager.destroyInstance(this._tabCollectionId);
				window.location = redirectURL;
			}
		},

		/**
		 * Updates the tab divs to use a minimum height of the page so they extend to the bottom of the page
		 */
		_windowResizeListener : function(){
			this._setOuterMin();
			this._setInnerMin();
		},

		_setOuterMin : function(){
			var $content 	= $(this._selectorPrefix + " > .tab-content > .active");
			if ($content.length > 0){
				// Retrieve the ypos from the showing div and subtract from the window height
				var height 	= $(window).height() - $content.offset().top - 2; // 2 for the border
				height		-= $content.findParentByClass("workboxContentWrapper").css("padding-bottom").replace(/[^-\d\.]/g, '');
				// Set the height of all the divs
                var $pane   = $content.parent().find("> .tab-pane");
                var prop    = ($pane.attr("data-showing") == "true") ? "min-height" : "height";
				$pane.css(prop, Math.round(height));
                console.log("Setting outer ", prop, " to ", Math.round(height), " on ", $content.length, " items");
			}
		},

		_setInnerMin : function(){
			var $popupContent	= $(".modal-body " + this._selectorPrefix + " .active .moduleHolder");
			if ($popupContent.length > 0) return;
			var $content		= $(this._selectorPrefix + " .active .modulesWrapper");
			if ($content.length > 0){
				// Retrieve the ypos from the showing div and subtract from the window height
				//var height	= $(window).height() - $content.offset().top;
				var height	= $(window).height() - 258;
				var $footer	= $(this._selectorPrefix + " .active .footerButtonHolder");
				height		-= ($footer.length > 0) ? 108 : 0;
				height		-= 2;

				// Set the height of all the divs
				$content.css("min-height", Math.round(height));
                console.log("Setting inner min-height to ", Math.round(height), " on ", $content.length, " items");
			}
		}
	},
	{
		/*---------------------------------------------+
		| STATIC REGISTRATION METHODS				   |
		+---------------------------------------------*/
		_classRegister	: {},
		registerInstance : function(tabCollectionId, inst){
			this._classRegister[tabCollectionId] = inst;
		},
		retrieveInstance : function(tabCollectionId){
			return this._classRegister[tabCollectionId];
		},
		destroyInstance : function(tabCollectionId){
			var inst = this._classRegister[tabCollectionId];
			delete this._classRegister[tabCollectionId];
			if (inst != null) inst.destroy();
		},

		/**
		 * Global destroy method that destroys all PreloadManagers & ModuleRequestFramework instances for a dom element
		 * @param $element jQuery selector
		 */
		destroyForDomElement : function($element){
			$element	= $($element);
			// Find all the tabs to use for reference to destroy managers
			var $tabs 	= $element.find(".workboxContentWrapper > .tab-pane");

			if ($tabs.length > 0){
				console.log("Destroying TabCollectionManagers for dom element", $element);
				// First destroy the tab collection manager
				var tabCollectionId = $tabs.first().attr("data-tab-collection-id");
				workbox.TabCollectionManager.destroyInstance(tabCollectionId);

				// Now destroy any possible PreloadManager's and or ModuleRequestFramework instances
				$tabs.each(function(index, element){
					var $element	= $(element);
					var tabId		= $element.attr("data-tab-id");
					var instanceId	= tabCollectionId + "_" + tabId;
					workbox.PreloadManager.destroyInstance(instanceId);
					workbox.ModuleRequestFramework.destroyInstance(tabCollectionId, tabId);
				});
			}
			else{
				console.log("No elements found to destroy for dom element", $element);
			}
		}
	}
);