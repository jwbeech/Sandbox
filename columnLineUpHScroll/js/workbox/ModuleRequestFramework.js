registerClasspath("workbox.ModuleRequestFramework", {});

/**
 * This class is used to facilitate the submitting of all forms and reloading of parent data modules.
 * Each tab creates an instance of this class, each module registers itself with this instance then all further form submits are proxied through this class.
 * This allows us to inspect the request happening append data and update related modules
 */
workbox.ModuleRequestFramework = RootClass.extend(
	{

		// PRIVATE PROPERTIES
        /**
         * Initial parameter set per registration:
         * moduleId
         * parentModuleIds
         * preSaveURL
         * url
         * params
         * dependencies
         * moduleHolderSelector
         * $moduleHolderSelector
         * isRootModule
         * isSubModule
         * isPopup
         * closeCallback
         * loaded
         *
         * Parameters captured post registration:
         * destroy
         * getDataCallback
         * dataStore
         * reloadOverride
         */
        _moduleRegister		    : null,
		_buttonRegister		    : null,
		_depHash			    : null,
		_resolvedHash		    : null,

		_tabCollectionId	    : null,
		_tabId				    : null,
		_globalParams		    : null,
        _loadingCycleComplete   : false,

		/*----------------------------------------------+
		| PUBLIC METHODS								|
		+----------------------------------------------*/

        /*
        INNER MODULE API
        --------------------------------------------
        */
        /**
         * This can be called from within a module to register a destroy method to be called when the module is destroyed
         * @param moduleId {String} The id of the module to attach this to
         * @param destroy {Boolean} The method to execute when destroying
         */
        registerModuleDestroy : function(moduleId, destroy){
            this._moduleRegister[moduleId].destroy = destroy;
        },

        /**
         * This can be called from within a module to register an alternate method to use to retrieve the data
         * @param moduleId {String} The id of the module to attach this to
         * @param getDataCallback {Function} The method to execute, should return an object
         */
        registerModuleGetData : function(moduleId, getDataCallback){
            this._moduleRegister[moduleId].getDataCallback = getDataCallback;
        },

        /**
         * This is used to store random data for a module, this can be used to share data with a popup
         * @param moduleId {String} The id of the module to attach this to
         * @param key {String} The name of the param to be stored against the module
         * @param value {Object} The value to be stored
         */
        registerModuleKeyValue : function(moduleId, key, value){
            var vo = this._moduleRegister[moduleId];
            if (!vo.dataStore) vo.dataStore = {};
            if (!value){
                delete vo.dataStore[key]
            }
            else{
                vo.dataStore[key] = value;
            }
        },

        /**
         * This is used to retrieve random data for a module, this can be used to share data with a popup
         * @param moduleId {String} The id of the module to attach this to
         * @param key {String} The name of the param to be retrieved
         * @returns {Object} The data value
         */
        fetchModuleValue : function(moduleId, key){
            return this._moduleRegister[moduleId].dataStore[key];
        },

        /**
         * This is used to store an override for the reload call on a module, populating this will execute this method instead of realoding this module.
         * @param moduleId {String} The id of the module to attach this to
         * @param method {Function} The method to call when reloading the module
         */
        registerModuleReloadOverride : function(moduleId, method){
            this._moduleRegister[moduleId].reloadOverride = method;
        },


        /**
         * Reloads a module manually by id
         * @param moduleId {String} The id of the module to reload
         */
        reloadModule : function(moduleId){
            this._loadModule(moduleId);
        },

        /**
         * Reloads a module manually by name and tabId
         * @param moduleNameList {Array} An array of modules to update
         */
        invalidateModules : function(moduleNameList){
            // Create an easy access hash
            var moduleHash  = {};
            _.each(moduleNameList, function(name) { moduleHash[name] = true; });
            var found       = false;
            for (var moduleId in this._moduleRegister){
                var vo          = this._moduleRegister[moduleId];
                if (moduleHash[vo.moduleName] === true){
                    vo.loaded   = false;
                    found       = true;
                }
            }
            if (found && this._loadingCycleComplete){
                this._loadingCycleComplete = false;
                this._runNextModuleLoadOrUnload();
            }
        },


        /**
         * Used to close a popup from with a module
         * @param moduleId {String} The module id to close
         */
        closePopupModule : function(moduleId, runParentReload){
            if (runParentReload == null || runParentReload == true){
                this._runDependantModuleReloads([moduleId], {}, null);
            }
            if (this._moduleRegister[moduleId].hasOwnProperty("closeCallback")){
                this._moduleRegister[moduleId].closeCallback();
            }
        },

		/**
		 * Used to update module urls called outside of this system
		 * @param url {String} The URL to update
		 * @param moduleId {String} The module id to get the extra data from
         * @param additionalData {Object} Optional. Any additional data properties that need to be added to the url
		 * @returns {String} The updated url
		 */
        updateURLForModule : function(url, moduleId, additionalData){
            return this._moduleRegister[moduleId].params.addDataToURL(url, additionalData);
        },

        updateURLForModuleFunc : function(moduleId){
            return this._moduleRegister[moduleId].params.addDataToURL;
        },

        /**
         * Used to update module urls called outside of this system
         * @param url {String} The URL to update
         * @param buttonId {String} The button id to get the extra data from
         * @returns {String} The updated url
         */
        updateURLForButton : function(url, buttonId){
            return this._buttonRegister[buttonId].params.addDataToURL(url);
        },

        /**
         * Returns a jquery selected module holder by moduleId
         * @param moduleId {String} The module id to get the holder for
         */
        getModuleHolder : function(moduleId){
            return this._getModuleHolder(moduleId);
        },

        /**
         * Returns the module's name
         * @param moduleId {String} The module id to get the holder for
         */
        getModuleName : function(moduleId){
            return (this._moduleRegister[moduleId]) ? this._moduleRegister[moduleId].moduleName : null;
        },

        /**
         * Returns the current string based state for a module
         * @param moduleId {String} The module id to get the state
         */
        getModuleState : function(moduleId){
            return this._moduleRegister[moduleId].state;
        },

        /**
         * Changes a module's state and makes any linked module changes
         * @param moduleId {String} The module id to change the state for
         * @param newState {String} The new state to change to
         */
        setModuleState : function(moduleId, newState){
            console.log("Chaging module state to " + newState + " for module " + moduleId);
            this._setModuleState(moduleId, newState);
        },

        /**
         * Allows you to manually trigger reloadFors. You might not want to reload a module but technically have made a change
         * @param moduleId
         */
        triggerReloadFors : function(moduleId){
            // Run through all the modules and check their reloadForList against the moduleId that has reloaded
            _.each(this._moduleRegister, function(moduleVO){
                if (moduleVO.moduleId != moduleId){
                    for (var i = 0; i < moduleVO.reloadForList.length; i++){
                        var currModuleId = moduleVO.reloadForList[i];
                        if (currModuleId == moduleId && moduleVO.loaded && moduleVO.loading != true) {
                            this._loadModule(moduleVO.moduleId, false);
                            break;
                        }
                    }
                }
            }, this);
        },

        /**
         * Triggers a module load start event, used for executing module calls outside of the framework
         * @param moduleId
         */
        triggerModuleLoadStart : function(moduleId){
            this._getModuleHolder(moduleId).trigger(Events.MODULE_POST_START);
        },

        /**
         * Triggers a module load end event, used for executing module calls outside of the framework
         * @param moduleId
         */
        triggerModuleLoadEnd : function(moduleId){
            this._triggerModulePOSTEnd(moduleId)
        },
















        /**
         * Used to register a specific pre save url per task tab
         * @param tabCollectionId {String} The tabCollection Id for this instance
         * @param tabId {String} The tab id for this instance
         * @param globalParams {Object} An object containing a list of params to be passed with every module call
         */
        initialize : function(tabCollectionId, tabId, globalParams){
            console.log("ModuleRequestFramework created tabCollectionId (" + tabCollectionId + "), tabId (" + tabId + ")");
            this._moduleRegister	    = {};
            this._buttonRegister	    = {};
            this._depHash			    = {};
            this._resolvedHash		    = {};
            this._tabCollectionId	    = tabCollectionId;
            this._tabId				    = tabId;
            this._globalParams		    = globalParams;
        },

        /**
         * Registers an id and parentId along with other various module properties to maintain a hierarchical chain
         * @param moduleId {String} A unique id to identify a section
         * @param moduleName {String} The name of the module. IE the controller's name
         * @param parentModuleId {String} A unique id for the parent of this module (not required for the root module)
         * @param preSaveURL {String} The url to execute before a module save optional.
         * @param url {String} The url used to load the module
         * @param dependencies {Object} An object containing parameters and mappings to module dependencies
         * @param showForConfig {Object} An object of state mappings to be used to load a module or not
         * @param reloadForList {Array} An array of module ids that when reloaded should trigger this module to reload
         * @param additionalDataProps {Object} Any additional data properties that need to be sent with every call
         * @param moduleHolderSelector {String} The jQuery selector for the module holder
         * @param isRootModule {Boolean} Must be set to true for a root module
         * @param isSubModule {Boolean} Must be set to true for a sub module
         * @param isPopup {Boolean} Must be true if the module is a part of a popup, helps to decide where to run updates when stuff is saved. Defaults to false
         * @param isTabModule {Boolean} Must be true if the module is a part of a tab
         * @param isFirstTab {Boolean} Must be true for the modules in the first tab - these are auto loaded the rest aren't
         * @param closeCallback {Function} A method to execute to close a module popup
         */
        registerModuleAndLoad : function(moduleId, moduleName, parentModuleId, preSaveURL, url, dependencies, additionalDataProps, showForConfig, reloadForList, moduleHolderSelector, isRootModule, isSubModule, isPopup, isTabModule, isFirstTab, closeCallback){
            console.log("Registering module (" + moduleId + "), name (" + moduleName + "), parent (" + parentModuleId +"), url (" + url + ")");

            var params = new shared.URLBuilder();
            params.storeRawData(this._globalParams);
            params.storeRawData({moduleId:moduleId});
            params.storeRawData(additionalDataProps);

            // Move any resolved dependencies straight to the params
            if (dependencies){
                var toAdd       = {};
                // Unresolved dependencies are identified with a "." somewhere in the value because they reference a property
                var name;
                for (name in dependencies){
                    var value   = String(dependencies[name]);
                    if (value && value.indexOf(".") == -1){
                        toAdd[name] = dependencies[name];
                    }
                }
                params.storeRawData(toAdd);
                for (name in toAdd) delete dependencies[name];
            }

            this._moduleRegister[moduleId] = {
                moduleId				: moduleId,
                moduleName              : moduleName,
                parentModuleIds			: ((parentModuleId == null || parentModuleId == "") ? [] : [parentModuleId]),
                preSaveURL				: ((preSaveURL != null && preSaveURL != "" && preSaveURL != "null") ? preSaveURL : null),
                url						: url,
                params					: params,
                dependencies			: (dependencies && !_.isEmpty(dependencies)) ? dependencies : null,
                showForConfig           : showForConfig,
                reloadForList           : (reloadForList && reloadForList.length > 0) ? reloadForList : [],
                state                   : null,
                moduleHolderSelector	: moduleHolderSelector,
                $moduleHolderSelector	: $(moduleHolderSelector),
                isRootModule			: (isRootModule == null ? false : isRootModule),
                isSubModule				: (isSubModule  == null ? false : isSubModule),
                isPopup					: (isPopup      == null ? false : isPopup),
                isTabModule             : (isTabModule  == null ? false : isTabModule),
                isFirstTab              : (isFirstTab   == null ? false : isFirstTab),
                closeCallback			: closeCallback,
                loaded					: false
            };

            // Update the hash for fast access to dependencies
            this._populateDepdencyHash(moduleId);

            // Load the module in the next thread
            this._runNextModuleLoadOrUnload();
        },

        /**
         * Used to register footer buttons
         * These are then kept up to date with dependencies they may have between other modules.
         * The dependencies can be retrieved using updateURLForButton
         * @param buttonId {String} The id of the button
         * @param targetModuleIds {Array} An array of module ids assigned to this button
         * @param isEnter {Boolean} Whether or not this button will respond to enter events on the target module forms
         * @param buttonSelector {String} The selector for the button
         * @param dependencies {Object} The dependencies for the button
         * @param additionalDataProps {Object} Any additional data properties that need to be sent with every call
         */
        registerButton : function(buttonId, targetModuleIds, isEnter, buttonSelector, dependencies, additionalDataProps){
            var params = new shared.URLBuilder();

            // Move any resolved dependencies straight to the params
            if (dependencies){
                var toAdd       = {};
                // Unresolved dependencies are identified with a "." somewhere in the value because they reference a property
                var name;
                for (name in dependencies){
                    var value   = String(dependencies[name]);
                    if (value && value.indexOf(".") == -1){
                        toAdd[name] = dependencies[name];
                    }
                }
                params.storeRawData(toAdd);
                for (name in toAdd) delete dependencies[name];
            }

            params.storeRawData(this._globalParams);
            params.storeRawData({buttonId:buttonId});
            params.storeRawData(additionalDataProps);
            this._buttonRegister[buttonId] = {
                params			: params,
                dependencies	: dependencies
            };
            // Update the hash for fast access to dependencies
            this._populateDepdencyHash(buttonId, true);

            // Add listeners to each form element for an enter press
            if (isEnter) {
                var moduleSelectors	= "";
                var targetComps     = [" form input", "form select"]; // Not text area
                _.each(targetModuleIds, function(id, i) {
                    moduleSelectors     += (i > 0) ? ", " : "";
                    var selector        = this._moduleRegister[id].moduleHolderSelector + " ";
                    _.each(targetComps, function(comp, p) {
                        moduleSelectors += (p > 0) ? ", " : "";
                        moduleSelectors += selector + comp;
                    }, this);
                }, this);
                $("body").on("keydown", moduleSelectors, function(e){
                    if (e.keyCode == 13){
                        e.preventDefault();
                        $(buttonSelector).trigger("click");
                    }
                });
            }
        },

        /**
         * Runs a web service POST with presave using a direct data set
         * @param moduleId {String} The module id
         * @param url {String}l The url to POST to
         * @param data {Object} Any data to be sent with the call
         * @param type {String} The method type to use for the call, defaults to POST
         */
        runDirectCall : function(moduleId, url, data, type) {
            // Inject module params into the url
            var params			= this._moduleRegister[moduleId].params;
            url					= params.addDataToURL(url);

            // Submit to the task controller the request to be governed
            var dataHash		= {};
            dataHash[moduleId]	= {url:url, data:data, type:(type == null ? "POST" : type)};

            // Run the presave call
            this._getModuleHolder(moduleId).trigger(Events.MODULE_POST_START);
            this._executePreSaves([moduleId], [moduleId], [url], dataHash, null);
        },

        /**
         * Runs multiple POSTs for a list of forms with presave
         * @param validationModuleIds {Array} An array of module ids that need to be validated
         * @param validationMsg {String} message to show should a validation issue occur
         * @param targetModuleIds {Array} An array of module ids to post
         * @param targetModuleURLs {Array} An array of urls to POST to
         * @param buttonId {String} The button selected id
         * @param completeURL {String} A url to call on completion of all the module requests
         * @param closeCallback {Function} A callback to close a popup after call has executed
         * @param allModuleIds {Array} A collection of all the module ids on the page, used for events when there is no validation
         */
        multiFormSubmit : function(validationModuleIds, validationMsg, targetModuleIds, targetModuleURLs, buttonId, completeURL, closeCallback, allModuleIds)
        {
            // Perform any required validation
            if (validationModuleIds.length > 0) {
                var allValid	    = true;
                var cnt             = 1;

                // Try to validate all the modules in the list.
                // Ignore if there is no validate function defined
                _.each(validationModuleIds, function(moduleId){
                    var moduleVO        = this._moduleRegister[moduleId];
                    var $moduleForms    = $(this._moduleRegister[moduleId].moduleHolderSelector + " form");
                    $moduleForms.each(function(index, item){
                        var $item		= $(item);
                        if (_.isFunction($item.validate)){
                            console.log("Validating form: " + cnt);
                            var result	= $item.validate().form();
                            if (!result && allValid) allValid = false;
                        }
                        cnt++;
                    });
                }, this);

                // Show a catch all message if there was any failures
                if (!allValid) {
                    shared.PopupManager.showValidation(validationMsg);
                    return;
                }
            }

            // Sanity check on the data
            if (targetModuleIds.length != targetModuleURLs.length) throw new Error("targetModuleIds is not the same length as targetModuleURLs please check your module definition.");

            // Fix data input from gsp
            completeURL				= (completeURL == "" || completeURL == "null") ? null : completeURL;
            // Store complete params against the button
            this._buttonRegister[buttonId].completeURL		= completeURL;
            this._buttonRegister[buttonId].closeCallback	= closeCallback;

            if (targetModuleIds.length > 0){
                // Collect a dataHash for all the requests
                var dataHash	    = {};
                var newModuleIds    = [];
                var newModuleUrls   = [];
                _.each(targetModuleIds, function(id, i){
                    var module	= this._moduleRegister[id];
                    if (module.loaded){
                        var dataToUse	= (module.getDataCallback != null) ? module.getDataCallback() : shared.FormUtils.serialiseForm(module.moduleHolderSelector + " form");
                        dataHash[id]	= {url:targetModuleURLs[i], data:dataToUse};
                        newModuleIds.push(id);
                        newModuleUrls.push(targetModuleURLs[i]);
                    }
                }, this);
                targetModuleIds         = newModuleIds;
                targetModuleURLs        = newModuleUrls;

                // Run the presave call
                this._getModuleHolder(targetModuleIds[0]).trigger(Events.MODULE_POST_START);
                this._executePreSaves(targetModuleIds.concat(), targetModuleIds, targetModuleURLs, dataHash, buttonId);
            }
            else{
                this._getModuleHolder(allModuleIds[0]).trigger(Events.MODULE_POST_START);
                this._runComplete(allModuleIds, {}, buttonId);
            }
        },

        /**
         * Loads a list of modules based on the id's passed in.
         * These modules will only load if they are not loaded already.
         * These modules will only load if they are setup as tab modules when registered
         * @param moduleIds {Array} An array of module ids to load.
         */
        loadTabModules : function(moduleIds){
            _.each(moduleIds, function(moduleId){
                var vo = this._moduleRegister[moduleId];
                if (!vo.loaded && !vo.loading && vo.isTabModule){
                    console.log("Loading up a new tab module: ", moduleId);
                    this._loadModule(moduleId)
                }
            }, this);
        },

        /**
         * Destroys the instance
         */
        destroy : function(){
            console.log("ModuleRequestFramework destroy: ", this._tabCollectionId, this._tabId);
            var modIds = [];
            for (var modId in this._moduleRegister) modIds.push(modId);
            var butIds = [];
            for (var butId in this._buttonRegister) butIds.push(butId);
            this.destroyModules(modIds, butIds);
        },

        /**
         * Removes a set of modules from the store, used for clearing popup modules and their buttons
         * @param moduleIds {Array} An array of module ids to destroy
         * @param buttonIds {Array} An array of button ids to destroy
         */
        destroyModules : function(moduleIds, buttonIds){
            // Remove from the module / button register, also remove any related cached dependencies
            var toRemove			= [];
            if (moduleIds){
                _.each(moduleIds, function(id){
                    if (this._moduleRegister[id]){
                        // Store the names to remove from this._resolvedHash
                        for (var name in this._resolvedHash) if (name.indexOf(id) == 0) toRemove.push(name);
                        shared.FormUtils.destroyComponents(this._moduleRegister[id].moduleHolderSelector);
                        if (this._moduleRegister[id].destroy){
                            this._moduleRegister[id].destroy();
                        }

                        // Abort anty ajax requests for this module
                        _.each(this._moduleRegister[id].requests, function(jqxhr) { jqxhr.abort(); });

                        delete this._moduleRegister[id];
                    }
                    delete this._depHash[id];
                }, this);
            }
            if (buttonIds){
                _.each(buttonIds, function(id){
                    // Store the names to remove from this._resolvedHash
                    for (var name in this._resolvedHash) if (name.indexOf(id) == 0) toRemove.push(name);

                    // Abort anty ajax requests for this button
                    _.each(this._buttonRegister[id].requests, function(jqxhr) { jqxhr.abort(); });

                    delete this._buttonRegister[id];
                }, this);
            }
            // run through and delete items to remove
            _.each(toRemove, function(name){ delete this._resolvedHash[name]; }, this)
        },

		/*----------------------------------------------+
		| PRIVATE METHODS								|
		+----------------------------------------------*/
        /**
         * Used to load the next set of modules in the predefined queue
         */
		_runNextModuleLoadOrUnload : function(lastModuleId){
			var foundRoot = false, foundLoading = false, clearModuleIds = [], loadingHash = {}, canShow, moduleId, vo;

			for (moduleId in this._moduleRegister){
				vo				= this._moduleRegister[moduleId];
                if (vo.loading) {
                    foundLoading = true;
                    break;
                }
                canShow = this._canShowModule(moduleId);
                // Load if it meets all the conditions
                if (!vo.loaded && !vo.isSubModule && canShow){
                    if (!vo.isTabModule || (vo.isTabModule && vo.isFirstTab)){
                        // check if it has dependencies on any of the currently loading items
                        if (!this._moduleHasDependenciesInLoadingHash(moduleId, loadingHash)){
                            foundRoot	= true;
                            this._loadModule(moduleId, true);
                            loadingHash[moduleId] = true;
                        }
                    }
                }
                // Unload if it shouldn't be showing and set to !loaded
                else if (vo.loaded && !canShow){
                    clearModuleIds.push(vo.moduleId);
                }
			}
			// No root modules found then load all the children
			if (!foundRoot && !foundLoading){
				// If no more root items and there is a last id then dispatch off of it
				if (lastModuleId != null) this._moduleRegister[lastModuleId].$moduleHolderSelector.trigger(Events.ALL_ROOT_MODULES_LOADED);

                var found = false;
				for (moduleId in this._moduleRegister){
					vo		= this._moduleRegister[moduleId];
                    canShow = this._canShowModule(moduleId);
                    // Load if it meets all the conditions
					if (!vo.loaded && vo.isSubModule){
                        if (!vo.isTabModule || (vo.isTabModule && vo.isFirstTab)){
                            this._loadModule(moduleId, true);
                            found = true;
                            break;
                        }
					}
                    // Unload if it shouldn't be showing and set to !loaded
                    else if (vo.loaded && !canShow){
                        clearModuleIds.push(vo.moduleId);
                    }

				}
                // If the code gets here there is nothing left to load
                if (!found) this._loadingCycleComplete = true;

                // Clear out all the modules that need to be
                _.each(clearModuleIds, function(moduleId){
                    vo          = this._moduleRegister[moduleId];
                    vo.loaded   = false;
                    this._setModuleHTML(vo.moduleId, "");
                    this._setModuleState(vo.moduleId, null);
                    vo.$moduleHolderSelector.trigger(Events.MODULE_UNLOADED);
                }, this);
			}
		},

		/**
		 * Simple global loading mechanism for loading HTML
		 * @param moduleId {String} A unique id to identify a section
         * @param checkModulesAfterLoad {Boolean} defaults to false, if true _runNextModuleLoadOrUnload is called when the module is loaded
		 * @private
		 */
		_loadModule : function(moduleId, checkModulesAfterLoad){
			var moduleVO	= this._moduleRegister[moduleId];
			var url			= moduleVO.params.addDataToURL(moduleVO.url);

			// Update dependencies using the data from the URL
			this._updateDependencies(moduleId, url);

			// Dispatch load start
			moduleVO.$moduleHolderSelector.trigger(Events.CHILD_MODULE_LOAD_START);


            moduleVO.loading    = true;
            moduleVO.loaded     = true;

			console.log("Loading module HTML for module: " + moduleId);
			this._ajax(moduleId, {
				url		: url,
				method	: "GET",
				success	: $.proxy(function(json){
                    console.log("Module reloaded successfully: ", moduleId);

                    // Set loading
                    moduleVO.loading = false;

                    if (json.html){
						this._renderModuleHTML(moduleId, json);
						if (checkModulesAfterLoad === true) this._runNextModuleLoadOrUnload(moduleId);

						// Dispatch complete
						moduleVO.$moduleHolderSelector.trigger(Events.CHILD_MODULE_LOAD_END);
					}
				}, this)
			});
		},


		/*
		PRE SAVE AND MODULE POST
		--------------------------------------------
		*/
		/**
		 * Recursive method that runs any presave call defined for a module to check if there is any blocking business logic
		 * @private
		 */
		_executePreSaves : function(originalModuleIds, runningModuleIds, urls, dataHash, buttonId){
			var preSaveURL	= null;
			var moduleData;
			while (runningModuleIds.length > 0 && preSaveURL == null){
				var currId		= runningModuleIds.pop();
				var moduleVO	= this._moduleRegister[currId];
				preSaveURL		= moduleVO.preSaveURL;
				moduleData		= dataHash[currId];
			}

			if (preSaveURL){
				// Submit to the task controller the request to be governed
                console.log("Executing presave for ", moduleData);
                this._ajax(moduleData.moduleId, {
					url		: preSaveURL,
					method	: "POST",
					data	: {url:moduleData.url, data:JSON.stringify(moduleData.data)},
					success	: $.proxy(function(json){
						// If passed run the actual calls
						if (json.passed){
							this._executePreSaves(originalModuleIds, runningModuleIds, urls, dataHash, buttonId);
						}
						// Otherwise print out the error
						else{
							this._triggerModulePOSTEnd(currId);
						}
					}, this)
				});
			}
			else{
				this._runNextModuleCall(_.clone(originalModuleIds), originalModuleIds, urls, dataHash, buttonId);
			}
		},


		/**
		 * Runs a module post then recursively executes until there are no more to run
		 * @private
		 */
		_runNextModuleCall : function(originalModuleIds, runningModuleIds, urls, dataHash, buttonId){
			if (runningModuleIds.length > 0){
				var url			= urls.shift();
				var moduleId	= runningModuleIds.shift();

                // Update the url with the module params
                url             = this._moduleRegister[moduleId].params.addDataToURL(url);
                if (buttonId != null && this._buttonRegister[buttonId]){
                    url         = this._buttonRegister[buttonId].params.addDataToURL(url);
                }

                var moduleData  = dataHash[moduleId];

                console.log("Executing next module call for ", this._moduleRegister[moduleId]);
                this._ajax(moduleId, {
					url		: url,
					type	: moduleData.type != null ? moduleData.type : "POST",
					data	: {data:JSON.stringify(moduleData.data)},
					success	: $.proxy(function(json){
						this._renderModuleHTML(moduleId, json, originalModuleIds);

						// render any errors if there are
						if (json.error){
							console.log("errors found");
							this._triggerModulePOSTEnd(moduleId);
						}
						else{
							this._runNextModuleCall(originalModuleIds, runningModuleIds, urls, dataHash, buttonId);
						}
					}, this)
				});
			}
			else{
				this._runComplete(originalModuleIds, dataHash, buttonId);
			}
		},

		/**
		 * Runs the complete url and handles the JSON result
		 * @private
		 */
		_runComplete : function(targetModuleIds, dataHash, buttonId){
			var buttonVO	= (buttonId) ? this._buttonRegister[buttonId] : null;

			if (buttonVO && buttonVO.completeURL){
				buttonVO.completeURL = buttonVO.params.addDataToURL(buttonVO.completeURL);
                console.log("Executing button completeURL ", this._buttonRegister[buttonId]);
                this._ajax(buttonId, {
					url		: buttonVO.completeURL,
					method	: "POST",
					success	: $.proxy(function(json, textStatus, jqXHR){
						if (json.passed){
							if (json.redirect){
								// Do nothing as the redirect will be taken care of elsewhere
							}
							else if (json.tabReloadURL){
								workbox.TabCollectionManager.retrieveInstance(this._tabCollectionId).reloadAndProcessNewTabs(json.tabReloadURL, json.redirectURL);
								//this._triggerModulePOSTEnd(targetModuleIds[0]);
							}
							else{
								this._runDependantModuleReloads(targetModuleIds, dataHash);
								this._triggerModulePOSTEnd(targetModuleIds[0]);
							}
						}
						else{
							this._triggerModulePOSTEnd(targetModuleIds[0]);
						}
					}, this)
				});
			}
			else{
				this._triggerModulePOSTEnd(targetModuleIds[0]);
				this._runDependantModuleReloads(targetModuleIds, dataHash, buttonId);
			}
		},

		/**
		 * This method runs up the parent tree and updates all parents after a POST call
		 * @private
		 */
		_runDependantModuleReloads : function(targetModuleIds, dataHash, buttonId){
			console.log("Running module updates after a POSTs for targetModuleIds: " + targetModuleIds.join(","));

			// Create an array of all the modules to reload
			var reloadHash			= {};

			// See if there were any create's as this changes the update scheme
			var hasCreate			= false;
			for (var moduleId in dataHash){
				var actualData		= dataHash[moduleId].data;
				if (actualData && actualData.hasOwnProperty("id") && actualData.id == null){
					hasCreate		= true;
					break;
				}
			}

			// Run through the parent hierarchy and update all parents until we hit a root or popup screen
			_.each(targetModuleIds, function(moduleId){
				var originalItem	= this._moduleRegister[moduleId];

				// Get all children for a create
				if (hasCreate && (originalItem.isRootModule || originalItem.isPopup)){
					for (var subModuleId in this._moduleRegister){
						var testItem	= this._moduleRegister[subModuleId];
						var parentId	= ((testItem.parentModuleIds && testItem.parentModuleIds.length > 0) ? testItem.parentModuleIds[0] : null);
						if (parentId && parentId == moduleId){
							reloadHash[subModuleId]	= true;
						}
					}
				}
				// Parent updating for popup creates or other items
				if (!hasCreate || originalItem.isPopup){
					// Recursive method that cannot be fulfilled in a loop
					function updateRecursive(moduleId, isFirst){
						var currItem = this._moduleRegister[moduleId];

						// Reload all but the first
						if (!isFirst) {
							reloadHash[moduleId] = true;
						}

						// If its not a popup or root screen continue to update its parents
						if ((!currItem.isPopup && !currItem.isRootModule) || isFirst){
							_.each(currItem.parentModuleIds, function(id){
								$.proxy(updateRecursive, this, id, false)();
							}, this);
						}
					}

					// Collate all the parents to update
					$.proxy(updateRecursive, this, moduleId, true)();
				}

			}, this);


			// Call the popup close if there is one registered
			if (buttonId && this._buttonRegister[buttonId].closeCallback){
				this._buttonRegister[buttonId].closeCallback();
			}


			// Run the actual reloads and add to the callback stack
			for (var moduleId in reloadHash){
                // Make sure it still exists, a previous load may have destroyed the next module
                if (this._moduleRegister[moduleId]){
                    if (this._moduleRegister[moduleId].hasOwnProperty("reloadOverride")){
                        this._moduleRegister[moduleId].reloadOverride();
                    }
                    else{
                        this._loadModule(moduleId);
                    }
                }
			}
		},

        _checkReloadForList : function(moduleId, originalModuleIds){
            var originalHash    = _.hashify(null, originalModuleIds);
            var nullOriginal    = (originalModuleIds == null || originalHash.length == 0);

            // Run through all the modules and check their reloadForList against the relatedIdHash
            _.each(this._moduleRegister, function(moduleVO){
                if (moduleVO.moduleId != moduleId && (nullOriginal || originalHash[moduleVO.moduleId] !== true)){
                    for (var i = 0; i < moduleVO.reloadForList.length; i++){
                        var currModuleId = moduleVO.reloadForList[i];
                        if (currModuleId == moduleId && moduleVO.loaded && moduleVO.loading != true) {
                            this._loadModule(moduleVO.moduleId, false);
                            break;
                        }
                    }
                }
            }, this);
        },


		/*
		UTILS
		--------------------------------------------
		*/

		/**
		 * Renders HTML in a module's container
		 * @param moduleId {String} The module id to target
		 * @param json {Object} The json containing the HTML to write and any dependant information
         * @param originalModuleIds {Array} Optional array of originalModuleIds
		 * @private
		 */
		_renderModuleHTML : function(moduleId, json, originalModuleIds){
			console.log("Rendering HTML for module ", moduleId);

			// Update dependencies
			this._updateDependencies(moduleId, null, json.data);

            // Update state management
            this._setModuleState(moduleId, (json.data && json.data.state ? json.data.state : null));

			if (json.html && json.html != ""){
                this._setModuleHTML(moduleId, json.html);
                this._checkReloadForList(moduleId, originalModuleIds);
			}
		},

        _setModuleHTML : function(moduleId, html){
            // Get the selector for the parent holder
            var selector = this._moduleRegister[moduleId].moduleHolderSelector;

            // Destroy any components that need to be
            shared.FormUtils.destroyComponents(selector);

            // Reload the HTML for the module
            var $holder = this._getModuleHolder(moduleId);
            $holder.css("min-height", $holder.height());
            $holder.html(html);
            $holder.css("min-height", "");

            // Trigger the reRender event for thr module container
            $holder.trigger(Events.MODULE_RENDER);

            // Update the loading state using the root preload manager
            workbox.PreloadManager.updateModule(selector);
        },

		/**
		 * Returns a jquery selected module holder by moduleId
		 * @private
		 */
		_getModuleHolder : function(moduleId){
			return this._moduleRegister[moduleId].$moduleHolderSelector.find(".moduleContent")
		},

        /**
         * Util to trigger an event on a module holder
         * @param moduleId {String} The module id to trigger off
         * @private
         */
		_triggerModulePOSTEnd : function(moduleId){
			this._getModuleHolder(moduleId).trigger(Events.MODULE_POST_END);
		},

		/**
		 * Used to update a hash so the finding dependencies between modules is fast as it occurs quite regularly
		 * Also resolve any previously resolved dependencies
		 * @param id {String} The id module or button for the just added
		 * @param isButton {Boolean} Must be true for a button store
		 * @private
		 */
		_populateDepdencyHash : function(id, isButton){
			isButton		= (isButton == null) ? false : isButton;
			// Get the module, run through its dependencies and link them to its id
			var vo			= (isButton) ? this._buttonRegister[id] : this._moduleRegister[id];
			if (vo.dependencies){
				for (var propName in vo.dependencies){
					var value		= String(vo.dependencies[propName]);
					var relatedId	= value.substr(0, value.indexOf("."));
					if (this._resolvedHash[value]){
						vo.params.storeRawEntry(propName, this._resolvedHash[value]);
					}
					else{
						// We map using a sub hash so modules are not repeated
						if (this._depHash[relatedId] == null){
							this._depHash[relatedId] = {};
						}
						this._depHash[relatedId][id] = (isButton) ? "button" : "module";
					}
				}
			}
			var pp = "";
		},

        _moduleHasDependenciesInLoadingHash : function(moduleId, loadingHash){
            // First see if there are any dependencies
            // Then check if the related id is loading
            var result  = false;
            for (var relatedId in this._depHash){
                for (var currId in this._depHash[relatedId]){
                    if (currId == moduleId){
                        result = (loadingHash[relatedId] != null);
                    }
                }
                if (result) break;
            }
            return result;
        },

		/**
		 * This method is used to update the param's data for dependant modules
		 * @param moduleId {String} The module id that the url or data belongs to
		 * @param url {String} The url to get the data from, not required if data is passed
		 * @param data {Object} The object to use to update the dependant modules, optional if url is passed
		 * @private
		 */
		_updateDependencies : function(moduleId, url, data){
			var relatedHash = this._depHash[moduleId];
			var key;

            // Parse url data into the object
            if (url) data = shared.URLBuilder.seperateURL(url).data;

            // Let put all the data into the resolved hash so it can be used by any or all modules
            if (data != null){
                for (key in data){
                    var name = moduleId + "." + key;
                    // Minor debugging measure, this is not necessarily a bad thing
                    if (this._resolvedHash[name] != null && this._resolvedHash[name] != data[key]){
                        console.log(">>>>>>>>>> NOTE: >>>>>>>> There is a parameter in the resolved hash that is being changed: ", name, " from ", this._resolvedHash[name], " to ", data[key]);
                    }
                    this._resolvedHash[name] = data[key];
                }
            }

			if (relatedHash){

				if (data && !_.isEmpty(data)){
					// First replace any missing data from the root module.
					var module			= this._moduleRegister[moduleId];
					// Replace dependencies as they are named as parameters
					var dataToAdd		= {};
					for (key in module.dependencies){
						var value		= _.getOnObject(data, key);
						if (value) dataToAdd[key] = value;
					}
					// For popups always add the id, this is always required
					if (module.isPopup && data.hasOwnProperty("id") && data.id != null){
						dataToAdd["id"]	= data.id;
					}
					// Now do the actual replace
					module.params.storeRawData(dataToAdd);
					// Remove and dependencies resolved
                    if (module.dependencies) for (key in dataToAdd) delete module.dependencies[key];



					// Run through the dependant modules and update them with the data available
					for (var depId in relatedHash){
						var type		= relatedHash[depId];
						module			= (type == "button") ? this._buttonRegister[depId] : this._moduleRegister[depId];
						dataToAdd		= {};
                        if (module){
                            if (module.dependencies){
                                for (key in module.dependencies){
                                    // Something like "435.person.id" 435 == module id which we don't need at this point
                                    var originalDepValue	= module.dependencies[key];

                                    // Lets make sure the module id where we are getting our data from matches the source.
                                    // To fix a bug where there was overlap. Employer Capture Employer Data
                                    var depId       = originalDepValue.substr(0, originalDepValue.indexOf("."));

                                    if (depId == moduleId){
                                        // Strip the module id
                                        var depMap  	= originalDepValue.substr(originalDepValue.indexOf(".") + 1);
                                        var depValue    = _.getOnObject(data, depMap);
                                        // Append to the data to add to the module and store at a global level
                                        if (depValue) {
                                            dataToAdd[key] = depValue;
                                            /*
                                            // Sanity check but this should never occur
                                            if (this._resolvedHash[originalDepValue] != null && this._resolvedHash[originalDepValue] != depValue){
                                                throw new Error("Warning there is a property mishap which is overriding a cached dependency");
                                            }
                                            this._resolvedHash[originalDepValue] = depValue;
                                            */
                                        }
                                    }
                                }
                            }

                            // Append the data
                            module.params.storeRawData(dataToAdd);
                            // Remove and dependencies resolved
                            for (key in dataToAdd) delete module.dependencies[key];
                        }
					}
				}
			}
		},


        _setModuleState : function(moduleId, newState){
            // If there is actually a state change
            if (this._moduleRegister[moduleId].state != newState){
                this._moduleRegister[moduleId].state = newState;

                // If not in a loading cycle then restart it, the loader will load and unload modules
                if (this._loadingCycleComplete){
                    this._loadingCycleComplete = false;
                    this._runNextModuleLoadOrUnload();
                }
            }
        },

        /**
         * Returns whether or not a module can be shown based on the showForConfig setup for this module
         * @param moduleId The moduleId to check against
         * @private
         */
        _canShowModule : function(moduleId){
            var moduleVO    = this._moduleRegister[moduleId];
            var canShow     = false;

            // First check if there are states
            if (moduleVO.showForConfig == null){
                canShow     = true;
            }
            else{
                // Check every combination for a show possibility
                for (var k = 0; k < moduleVO.showForConfig.length; k++){
                    var stateCombo  = moduleVO.showForConfig[k];
                    var comboMet    = true;
                    for (var i = 0; i < stateCombo.length; i++){
                        var stateDetails    = this._convertStateConfig(stateCombo[i]);
                        var testState       = this._moduleRegister[stateDetails.moduleId].state;
                        if (stateDetails.states[testState] !== true) {
                            comboMet        = false;
                            break;
                        }
                    }
                    if (comboMet){
                        canShow = true;
                        break;
                    }
                }
            }

            return canShow;
        },

        /**
         * Simply converts the state config state arrays to hashes for easy and fast checking
         * @private
         */
        _convertStateConfig : function(stateDetails){
            if (stateDetails.converted != true){
                var stateMap            = {};
                _.each(stateDetails.states, function(stateStr){ stateMap[stateStr] = true; });
                stateDetails.states     = stateMap;
                stateDetails.converted  = true;
            }
            return stateDetails;
        },

        /**
         * Proxy method for ajax calls so the requests are stored
         * @private
         */
        _ajax : function(moduleId, params){
            var jqxhr   = $.ajax(params);
            var data    = null;
            if (this._moduleRegister[moduleId]){
                data    = this._moduleRegister[moduleId];
            }
            else if (this._buttonRegister[moduleId]){
                data    = this._buttonRegister[moduleId];
            }
            else{
                console.error("Trying to run an ajax call for a module that doesn't exist");
            }
            if (data){
                if (data.requests == null){
                    data.requests = [];
                }
                data.requests.push(jqxhr);
            }
        }

	},

	{
		// Static class registration
		_classRegister	: {},

		/**
		 * Creates a new ModuleRequestFramework instance against a specific tabId and stores for later retrieval
		 * @param tabCollectionId The tabCollectionId to store against
		 * @param tabId The tab id to store against
		 * @param globalParams An object containing a list of params to be passed with every module call
		 * @returns {ModuleRequestFramework}
		 */
		createInstance : function(tabCollectionId, tabId, globalParams){
			if (!this._classRegister[tabCollectionId]){
				this._classRegister[tabCollectionId] = {};
			}
			this._classRegister[tabCollectionId][tabId] = new workbox.ModuleRequestFramework(tabCollectionId, tabId, globalParams);
			return this._classRegister[tabCollectionId][tabId];
		},

        retrieveInstance : function(tabCollectionId, tabId, createIfMissing, globalParams){
            var result;
            if (createIfMissing){
                if (!this._classRegister[tabCollectionId] || !this._classRegister[tabCollectionId][tabId]){
                    result = this.createInstance(tabCollectionId, tabId, globalParams)
                }
            }
            return (result) ? result : this._classRegister[tabCollectionId][tabId];
        },

        retrieveAllInstances : function(){
            return this._classRegister;
        },

		destroyInstance : function(tabCollectionId, tabId){
            // Check if it exists then destroy
            if (this._classRegister[tabCollectionId]){
                var inst = this._classRegister[tabCollectionId][tabId];
                delete this._classRegister[tabCollectionId][tabId];
                if (inst != null) inst.destroy();
            }
		}
	}
);