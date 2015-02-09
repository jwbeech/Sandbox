registerClasspath("InboxSearchManager", {});

InboxSearchManager =
{
    _showConsoleLogs                    : false,

    // States
    _DEFAULT_STATE                      : "defaultState",
    _ADVANCED_SEARCH_STATE              : "advancedSearchState",
    _SAVED_SEARCH_STATE                 : "savedSearchState",

    _savedSearchesList                  : null,

    // Main Components
    _$dataTable                         : null,

    _$advancedSearchFormHolder          : null,
    _$advancedSearchForm                : null,
    _$advancedSearchSaveForm            : null,

    _$mainSearchHolder                  : null,
    _$mainSearchField                   : null,
    _$mainSearchIcon                    : null,
    _$openAdvancedSearchPanelBtn        : null,
    _$advancedSearchPanel               : null,

    // Advanced search panel form components
    _$searchText                        : null,
    _$processNames                      : null,
    _$taskNames                         : null,
    _$ownerNames                        : null,
    _$outletNames                       : null,
    _$processInstanceId                 : null,
    _$createdFrom                       : null,
    _$createdTo                         : null,
    _$updatedFrom                       : null,
    _$updatedTo                         : null,
    _$advancedSearchBtn                 : null,
    _$clearSearchBtn                    : null,
    _$saveSearchScreenBtn               : null,

    // Save Search form components
    _$savedSearchName                   : null,
    _$saveAdvancedSearchBtn             : null,
    _$returnToSearchBtn                 : null,

    _urls                               : null,
    _locale                             : null,

    _ignoreNextBodyClick                : false,
    _popupShowing                       : false,
    _ignoreNextSearchFieldCloseEvent    : false,
    _datePickerSelected                 : false,
    _ignoreDatePickerChange             : false,
    _hasBeenSetup                       : false,

    _prevSearchFormHeight               : null,
    _savedSearchCriteria                : null,
    _initalized                         : null,

    _searchObj                          : {type:"advanced", data:JSON.stringify({searchText:""})},
    _searchCompleteCallback             : null,




    /*---------------------------------------------+
    | CONSTRUCTOR                 		           |
    +---------------------------------------------*/
    initialize : function(params)
    {
        this._initalized                    = true;
        this._savedSearchesList             = params.savedSearches;
        this._$dataTable                    = params.dataTable;

        this._$mainSearchHolder             = params.mainSearchHolder;
        this._$mainSearchField              = params.mainSearchField;
        this._$mainSearchIcon               = params.mainSearchIcon;

        this._$advancedSearchFormHolder     = params.advancedSearchFormHolder;
        this._$advancedSearchForm           = params.advancedSearchForm;
        this._$advancedSearchSaveForm       = params.advancedSearchSaveForm;
        this._$openAdvancedSearchPanelBtn   = params.openAdvancedSearchPanelBtn;
        this._$advancedSearchPanel          = params.advancedSearchPanel;

        this._$searchText                   = params.searchText;
        this._$processNames                 = params.processNames;
        this._$taskNames                    = params.taskNames;
        this._$ownerNames                   = params.ownerNames;
        this._$outletNames                  = params.outletNames;
        this._$processInstanceId            = params.processInstanceId;
        this._$createdFrom                  = params.createdFrom;
        this._$createdTo                    = params.createdTo;
        this._$updatedFrom                  = params.updatedFrom;
        this._$updatedTo                    = params.updatedTo;

        this._$savedSearchName              = params.savedSearchName;

        this._$advancedSearchBtn            = params.advancedSearchBtn;
        this._$clearSearchBtn               = params.clearSearchBtn;
        this._$saveSearchScreenBtn          = params.saveSearchScreenBtn;
        this._$saveAdvancedSearchBtn        = params.saveAdvancedSearchBtn;
        this._$returnToSearchBtn            = params.returnToSearchBtn;

        this._urls                          = params.urls;
        this._locale                        = params.locale;

        $("body").append(this._$advancedSearchPanel);

        this._setupDataTable(params.tableParams, params.recordsTotal);
        this._setupMainSearchField();
        this._addListeners();
    },

    /*---------------------------------------------+
    | PUBLIC METHODS           		               |
    +---------------------------------------------*/
    refreshSavedSearches : function(savedSearches)
    {
        this._log("refreshSavedSearches");
        if (this._initalized && savedSearches != null) {
            this._savedSearchesList     = savedSearches;
            var currSelectedSearchId    = this._$mainSearchField.select2("val")[0];

            this._$mainSearchField.select2("val", "");
            this._setupMainSearchField();

            if (currSelectedSearchId == this._locale.advancedSearch) {
                this._handleAdvancedSearchBtnClick();
            }
            else {
                var currSelectedSearchText;
                for (var i = 0; i<savedSearches.length; i++) {
                    if (savedSearches[i].id == currSelectedSearchId) {
                        currSelectedSearchText = savedSearches[i].text;
                        break;
                    }
                }

                // The currently selected saved search still exists
                if (currSelectedSearchText) {
                    this._$mainSearchField.select2("val", [currSelectedSearchText]);
                    this._doSavedSearch(currSelectedSearchId);
                    this._goIntoAdvancedORSavedSearchMode(true);
                }
                else {
                    this._savedSearchCriteria = null;
                    this._doSearch();
                }
            }
        }
    },



    /*---------------------------------------------+
    | PRIVATE METHODS           		           |
    +---------------------------------------------*/
    /*
    Show Advanced Search Panel
    Position, set state, load criteria
    --------------------------------------------
    */
    _showAdvancedSearchPanel : function()
    {
        this._log("_showAdvancedSearchPanel");
        this._adaptUIToCaterForShowPanel(true);

        if (!this._hasBeenSetup) {
            this._hasBeenSetup      = true;
            // Lazy loading implemented cause it doesn't make sense to
            // init the advanced panel every time the inbox loads
            this._setupAdvancedSearchPanelForm();
        }
        this._ignoreNextBodyClick   = true;

        this._positionAndAnimatePanelIn();

        // Establish state and act accordingly
        switch (this._getState()) {
            case this._DEFAULT_STATE:
                this._savedSearchCriteria = null;
                this._resetForms();
                this._$saveSearchScreenBtn.text(this._locale.saveThisSearch);
                break;

            case this._SAVED_SEARCH_STATE:
                this._resetForms();
                this._$saveSearchScreenBtn.text(this._locale.saveChangesToSearch);
                this._loadAndPopulateSavedSearchCriteria();
                break;

            case this._ADVANCED_SEARCH_STATE:
                this._$advancedSearchSaveForm[0].reset();
                this._savedSearchCriteria = null;
                this._$saveSearchScreenBtn.text(this._locale.saveThisSearch);
                break;
        }

        this._$searchText.keyup($.proxy(function(e){
            this._setSearchFieldTextOnly(this._$searchText.val());
        }, this));

        this._$searchText.focus();

        this._goIntoShowingAdvancedSearchPanelMode(true);
    },

    _loadAndPopulateSavedSearchCriteria : function()
    {
        if (this._savedSearchCriteria == null) {
            this._showPanelPreloader(true);
            var savedSearchId = this._$mainSearchField.select2("val")[0];
            $.ajax({
                url		: this._urls.getSavedSearchURL,
                type	: "POST",
                data	: {id:savedSearchId},
                success	: $.proxy(function(json){
                    if (json.data) {
                        this._savedSearchCriteria = json.data;
                        this._populateSavedSearchCriteria();
                    }
                }, this)
            });
        }
        else {
            this._populateSavedSearchCriteria();
        }
    },



    /*
    Search
    --------------------------------------------
    */
    _doSearch : function(formData)
    {
        formData = (formData == null) ? {searchText:""} : formData;
        this._searchObj = {type:"advanced", data:JSON.stringify(formData)};
        this._$dataTable.ffDataTable().reload();
    },

    _doSavedSearch : function(savedSearchId)
    {
        this._searchObj = {type:"saved", id:savedSearchId};
        this._searchCompleteCallback = $.proxy(function(searchText){
            this._setSearchFieldTextOnly(searchText);
        }, this);

        this._$dataTable.ffDataTable().reload();
    },

    _performSearch : function(data, callback, settings)
    {
        this._showProcessesPreloader(true);
        data.searchStr = JSON.stringify(this._searchObj);
        $.ajax({
            url		: this._urls.performSearchURL,
            type	: "POST",
            data	: data,
            success	: $.proxy(function(json){
                if (json.data) {
                    if (this._searchCompleteCallback) {
                        this._searchCompleteCallback(json.searchText);
                        this._searchCompleteCallback = null;
                    }
                    this._showProcessesPreloader(false);
                }
                callback(json);
            }, this)
        });
    },



    /*
    Setup
    --------------------------------------------
    */
    _setupDataTable : function(tableParams, recordsTotal)
    {
        var $table          = this._$dataTable;
        var dataTable       = $table.ffDataTable();
        tableParams.ajax    = $.proxy(this._performSearch, this);
        dataTable.createTable(tableParams);
        dataTable.hidePaginationIfNotEnoughItems(recordsTotal);
        $table.on("click", "tr", function (){
            var data = $table.dataTable().fnGetData(this);
            if (data && data.launchURL){
                window.location	= data.launchURL;
            }
        });
    },

    _setupMainSearchField : function()
    {
        this._$mainSearchField.select2({
            data:{
                more: false,
                results: (this._savedSearchesList.length != 0) ? [{text: this._locale.savedSearches, children: this._savedSearchesList}] : []
            },
            multiple:true,
            createSearchChoice : $.proxy(function(term)
            {
                return {id:"string", text:term + " " + this._locale.freeTextSearch}
            }, this),
            formatResult : $.proxy(function(state)
            {
                if (state.id == "string" || state.text == this._locale.savedSearches) {
                    return state.text;
                }
                else {
                    return '<span class="glyphicon glyphicon-floppy-disk"></span> ' + state.text;
                }
            }, this),
            formatNoMatches : $.proxy(function(term)
            {
                return this._locale.searchForAnything;
            }, this),
            initSelection : function(element, callback)
            {
                var data = [];
                $(element.val().split(",")).each(function () {
                    data.push({id: this, text: this});
                });
                callback(data);
            }
        });


    },

    _setupAdvancedSearchPanelForm : function()
    {
        // Process
        this._$processNames.select2({placeholder:this._locale.processes});
        // Tasks
        this._setupTasksSelect2();
        // Owners
        this._$ownerNames.select2({
            multiple            : true,
            minimumInputLength  : 1,
            initSelection       : this._defaultInitSelectionFunc,
            placeholder         : this._locale.owners,
            ajax                : this._defaultAjaxSearch(this._urls.ownerSearchURL)
        });
        // Outlets
        this._$outletNames.select2({
            multiple            : true,
            minimumInputLength  : 1,
            initSelection       : this._defaultInitSelectionFunc,
            placeholder         : this._locale.outlets,
            ajax                : this._defaultAjaxSearch(this._urls.outletSearchURL)
        });
    },

    _setupTasksSelect2 : function(selectedTasks, data)
    {
        // If data hasn't been supplied there are no processes selected.
        // Allow the user to search across all tasks in the system
        if (!data) {
            this._$taskNames.select2({
                multiple            : true,
                minimumInputLength  : 1,
                initSelection       : this._defaultInitSelectionFunc,
                placeholder         : this._locale.tasks,
                ajax                : this._defaultAjaxSearch(this._urls.taskSearchURL)
            });
        }
        // If data is provided
        // Only allow the user to filter through the provided data
        // This data is only the tasks that are available in the selected processes
        else {
            this._$taskNames.select2({
                multiple        : true,
                data            : data,
                placeholder     : this._locale.tasks,
                initSelection   : this._defaultInitSelectionFunc
            });
        }

        if (selectedTasks && selectedTasks.length != 0) {
            if (!data) {
                this._$taskNames.select2("data", selectedTasks);
            }
            else {
                var availableTasksHash  = [];
                var tasksToSelect       = [];
                _.each(data.results, function(item){ availableTasksHash[item.id] = true; });
                _.each(selectedTasks, function(item) {
                    if (availableTasksHash[item.id]) {
                        tasksToSelect.push(item);
                    }
                });
                tasksToSelect           = (tasksToSelect.length == 0) ? "" : tasksToSelect;
                this._$taskNames.select2("data", tasksToSelect);
            }
        }
    },

    _setupTasksBasedOnProcess : function(selectedProcesses)
    {
        var currentlySelectedTasks = this._$taskNames.select2("data");
        this._log("_setupTasksBasedOnProcess");
        this._log("currentlySelectedTasks: " + currentlySelectedTasks);

        if (selectedProcesses.length == 0) {
            this._setupTasksSelect2(currentlySelectedTasks);
        }
        else {
            $.ajax({
                url		: this._urls.taskListURL,
                type	: "POST",
                data	: {processes:JSON.stringify(selectedProcesses)},
                success	: $.proxy(function(json){
                    if (json.data) {
                        this._setupTasksSelect2(currentlySelectedTasks, {results:json.data});
                    }
                }, this)
            });
        }
    },



    /*
    Event Handlers
    --------------------------------------------
    */
    // Main Search Select 2 handlers
    _handleMainSearchSelected : function(e)
    {
        this._log("select2-selecting");
        // This is free text only search
        if (e.val == "string") {
            // Don't let the select2 component turn this free form text into a tag
            e.preventDefault();
            this._$mainSearchField.select2("close");
            this._doSearch({searchText:this._getSearchFieldTextOnly()});
            this._handleCloseAdvancedSearch();
        }
        // This is the selection of a saved search selection
        else {
            this._ignoreNextSearchFieldCloseEvent = true;
            this._$mainSearchField.one("select2-close", function(e){
                // Chris Beech: This is a HACK
                // I'm not sure why it doesn't work without the millisecond timeout
                // Running out of time to investigate so moving on
                setTimeout(function() { $(":focus").blur(); }, 10);
            });
            this._$mainSearchField.select2("close");
            this._goIntoAdvancedORSavedSearchMode(true);
            this._doSavedSearch(e.val);
        }
    },

    _handleMainSearchKeyPressed : function(e)
    {
        this._log("_handleMainSearchKeyPressed");
        if (this._$mainSearchField.select2("val").length == 0 && this._getSearchFieldTextOnly() == "") {
            this._doSearch();
        }
        // 13 == enter key
        if (e.which == 13) {
            if (this._$mainSearchField.select2("val").length == 0 && this._getSearchFieldTextOnly() == "") {
                this._handleCloseAdvancedSearch();
                this._doSearch();
            }
        }
    },

    _handleMainSearchClose : function()
    {
        this._log("select2-close OR select2-blur");
        if (this._ignoreNextSearchFieldCloseEvent == true) {
            this._log("_ignoreNextSearchFieldCloseEvent is true");
            // This is done so that when selecting an actual item in the select, the text used to find that selection isn't saved
            this._ignoreNextSearchFieldCloseEvent = false;
        }
        else {
            this._setSearchFieldTextOnly(this._getSearchFieldTextOnly());
        }
    },

    _handleMainSearchRemoved : function()
    {
        this._log("_handleMainSearchRemoved");
        this._resetForms();
        this._goIntoAdvancedORSavedSearchMode(false);
        this._setSearchFieldTextOnly("");
        this._handleCloseAdvancedSearch();
        this._doSearch();
    },
    // -----------------------------


    // Advanced Search Panel Buttons
    _handleAdvancedSearchBtnClick : function(e)
    {
        var formData            = this._getFormData();
        // Make sure the advanced search form is populated with something
        // before turning the component into advanced search state
        var formHasData         = this._getFormHasData(formData);
        var savedSearchMatches  = this._getSavedSearchMatchesFormData(formData);

        if ((formHasData == true && this._getState() == this._DEFAULT_STATE) ||
            (formHasData == true && this._getState() == this._SAVED_SEARCH_STATE && !savedSearchMatches)) {
            this._$mainSearchField.select2("val", [this._locale.advancedSearch]);
            this._goIntoAdvancedORSavedSearchMode(true);
        }
        else if (   (formHasData == false && this._getState() == this._ADVANCED_SEARCH_STATE) ||
                    (formHasData == false && this._getState() == this._SAVED_SEARCH_STATE)) {
            this._$mainSearchField.select2("val", "");
            this._goIntoAdvancedORSavedSearchMode(false);
        }

        this._setSearchFieldTextOnly(formData.searchText);
        this._handleCloseAdvancedSearch();
        this._doSearch(formData);
    },

    _handleSaveSearchScreenBtnClick : function(e)
    {
        if (!this._getFormHasData(this._getFormData())){
            this._showValidation(this._locale.pleaseAddSearchCriteria, this._$searchText);
        }
        else {
            this._showSearchForm(false);
            setTimeout($.proxy(function(){
                this._showSaveForm(true);
            }, this), 150);
        }
    },

    _handleSaveSearchBtnClick : function()
    {
        var savedSearchName = this._$savedSearchName.val();
        if (savedSearchName == "" || savedSearchName == " ") {
            this._showValidation(this._locale.pleaseEnterName, this._$savedSearchName);
        }
        else {
            var formData        = this._getFormData();

            var savedSearchId   = (this._savedSearchCriteria != null) ?  this._savedSearchCriteria.id : null;
            $.ajax({
                url		: this._urls.saveSearchURL,
                type	: "POST",
                data	: {data:JSON.stringify(formData), savedSearchName:savedSearchName, savedSearchId:savedSearchId},
                success	: $.proxy(function(json){
                    if (json.savedFilter) {
                        this._log("search saved");
                        this._savedSearchesList     = json.savedFiltersList;
                        this._savedSearchCriteria   = json.savedFilter;

                        this._setupMainSearchField();
                        this._$mainSearchField.select2("val", "");
                        this._$mainSearchField.select2("val", [this._savedSearchCriteria.savedSearchName]);
                        this._setSearchFieldTextOnly(this._savedSearchCriteria.searchText);
                        this._handleCloseAdvancedSearch();
                        this._doSavedSearch(this._savedSearchCriteria.id);
                        this._goIntoAdvancedORSavedSearchMode(true);
                    }
                }, this)
            });
        }
    },

    _handleBackToSearchScreenBtnClick : function(e)
    {
        this._showSaveForm(false);
        setTimeout($.proxy(function(){
            this._showSearchForm(true);
        }, this), 150);
    },

    _handleClearSearchBtnClick : function()
    {
        this._$mainSearchField.select2("val", "");
        this._resetForms();
        this._goIntoAdvancedORSavedSearchMode(false);
        this._doSearch();
    },
    // -----------------------------


    // Advanced Search Modes
    _handleAdvancedSearchModeSearchFieldClick : function()
    {
        this._$mainSearchField.select2("close");
        this._showAdvancedSearchPanel();
    },

    _handleAdvancedSearchPanelShowing_searchFieldClick : function()
    {
        this._$mainSearchField.select2("close");
        this._$searchText.focus();
    },
    // ---------------------


    // Handle click out side of panel
    _handleBodyClick : function(e)
    {
        this._log("_handleBodyClick");
        if (this._popupShowing) {
            this._log("_popupShowing: "  + this._popupShowing);
            return;
        }
        if (this._ignoreNextBodyClick){
            this._log("_ignoreNextBodyClick is true");
            this._ignoreNextBodyClick = false;
        }
        else{
            this._log("_ignoreNextBodyClick is false");
            if (this._datePickerSelected) {
                this._log("_datePickerSelected: " + this._datePickerSelected);
                this._datePickerSelected = false;
                return;
            }
            var $advancedSearchPanel    = this._$advancedSearchPanel;
            var $datePicker             = $(".datepicker");
            var hitsSearchPane          = ($.contains($advancedSearchPanel.get(0), e.target) || $advancedSearchPanel.is($(e.target)));
            var hitsDatePicker          = false;
            if ($datePicker.get(0) != null) {
                hitsDatePicker          = $.contains($datePicker.get(0), e.target);
            }
            this._log("hitsSearchPane: " + hitsSearchPane);
            this._log("hitsDatePicker: " + hitsDatePicker);
            if (!hitsSearchPane && !hitsDatePicker){
                this._handleCloseAdvancedSearch();
            }
        }
    },

    _handleCloseAdvancedSearch : function()
    {
        this._log("_handleCloseAdvancedSearch");
        this._adaptUIToCaterForShowPanel(false);
        this._$advancedSearchPanel.removeClass("animation200ms").removeClass("fadeInDown");
        this._$advancedSearchPanel.addClass("fadeOutUp animation150ms");
        setTimeout($.proxy(function(){ this._$advancedSearchPanel.css("display", "none"); }, this), 300);
        this._$searchText.off();
        this._goIntoShowingAdvancedSearchPanelMode(false);
    },

    _handleDatePickerChange : function(e)
    {
        this._log("_handleDatePickerChange");
        if (this._ignoreDatePickerChange) {
            this._log("_ignoreDatePickerChange: true");
        }
        else {
            this._datePickerSelected = true;

            var createdFrom = this._$createdFrom.ffDateInput("getDateValue");
            var createdTo   = this._$createdTo.ffDateInput("getDateValue");
            if ((createdFrom && createdTo) && (createdFrom > createdTo)) {
                this._$createdFrom.ffDateInput("setDateValue", createdTo);
            }

            var updatedFrom = this._$updatedFrom.ffDateInput("getDateValue");
            var updatedTo   = this._$updatedTo.ffDateInput("getDateValue");
            if ((updatedFrom && updatedTo) && (updatedFrom > updatedTo)) {
                this._$updatedFrom.ffDateInput("setDateValue", updatedTo);
            }
        }
    },
    // ------------------------------

    _addListeners : function()
    {
        this._log("_addListeners");

        /*
        Main Search Field
        --------------------------------------------
        */
        this._getSearchFieldInput().keyup($.proxy(this._handleMainSearchKeyPressed, this));
        this._$mainSearchField.on("select2-selecting", $.proxy(this._handleMainSearchSelected, this));
        this._$mainSearchField.on("select2-close", $.proxy(this._handleMainSearchClose, this));
        this._$mainSearchField.on("select2-blur", $.proxy(this._handleMainSearchClose, this));
        this._$mainSearchField.on("select2-removed", $.proxy(this._handleMainSearchRemoved, this));
        this._$mainSearchField.on("select2-clearing", $.proxy(function(e){  this._log("select2-clearing") }, this));
        this._$mainSearchField.on("select2-removing", $.proxy(function(e){  this._log("select2-removing") }, this));
        this._$openAdvancedSearchPanelBtn.on("click", $.proxy(this._showAdvancedSearchPanel, this));
        this._$mainSearchIcon.click($.proxy(function(){
            this._handleCloseAdvancedSearch();
            var formData    = this._getFormData();
            var formHasData = this._getFormHasData(formData);
            formData        = (formHasData) ? formData : {searchText:this._getSearchFieldTextOnly()};
            this._doSearch(formData);
        }, this));


        /*
        Advanced Search Panel
        --------------------------------------------
        */
        this._$advancedSearchForm.submit($.proxy(function(e) {
            e.preventDefault();
            this._handleAdvancedSearchBtnClick();
        }, this));
        this._$advancedSearchSaveForm.submit($.proxy(function(e) {
            e.preventDefault();
            this._handleSaveSearchBtnClick();
        }, this));

        // Clear
        this._$processNames.on("select2-blur", $.proxy(function(e){ this._handleBlur(); }, this));
        this._$taskNames.on("select2-blur", $.proxy(function(e){    this._handleBlur(); }, this));
        this._$outletNames.on("select2-blur", $.proxy(function(e){  this._handleBlur(); }, this));
        this._$ownerNames.on("select2-blur", $.proxy(function(e){   this._handleBlur(); }, this));


        // Buttons
        this._$advancedSearchBtn.click($.proxy(this._handleAdvancedSearchBtnClick, this));
        this._$clearSearchBtn.click($.proxy(this._handleClearSearchBtnClick, this));
        this._$saveSearchScreenBtn.click($.proxy(this._handleSaveSearchScreenBtnClick, this));
        this._$saveAdvancedSearchBtn.click($.proxy(this._handleSaveSearchBtnClick, this));
        this._$returnToSearchBtn.click($.proxy(this._handleBackToSearchScreenBtnClick, this));


        // Processes
        this._$processNames.on("change", $.proxy(function(e) {
            this._log("_handleProcessChange");
            this._setupTasksBasedOnProcess(e.val);
        }, this));

        // Manage closing of the search panel on click outside
        $("body").on("click", $.proxy(this._handleBodyClick, this));
        this._$createdFrom.on("dp.change", $.proxy(this._handleDatePickerChange, this));
        this._$createdTo.on("dp.change", $.proxy(this._handleDatePickerChange, this));
        this._$updatedFrom.on("dp.change", $.proxy(this._handleDatePickerChange, this));
        this._$updatedTo.on("dp.change", $.proxy(this._handleDatePickerChange, this));
    },


    /*
    SELECT2 HACK API
    --------------------------------------------
    */
    // This is a HACK to get hold of the search field's value.
    // The select2 component automatically clears the text on blur
    _getSearchFieldTextOnly : function()
    {
        var $searchFieldTextDiv = $("div.select2-sizer");
        return ($searchFieldTextDiv.text() != "") ? $searchFieldTextDiv.text() : this._getSearchFieldInput().val();
    },

    _setSearchFieldTextOnly : function(value)
    {
        var $input              = this._getSearchFieldInput();
        $input.val(value);

        // Set the width of the input to the maximum available
        var $totalInputHolder   = this._$mainSearchHolder.find("ul.select2-choices");
        var $selectedItem       = this._$mainSearchHolder.find("li.select2-search-choice");
        var newWidth            = $totalInputHolder.width() - $selectedItem.width() - 30;
        $input.css("width", newWidth);

        $("div.select2-sizer").html(value);
    },

    _getSearchFieldInput : function()
    {
        return this._$mainSearchHolder.find("input.select2-input");
    },

    _getSearchFieldDivWrapper : function()
    {
        return this._$mainSearchHolder.find("div.select2-container.select2-container-multi.form-control");
    },

    _handleBlur : function()
    {
        // Because we are hacking the select2 default functionality to get the search text input on the main search field
        // this will cause undesired behaviour if you blur an advanced search panel after entering text that doesn't match anything
        $("div.select2-sizer").html("");
    },



    /*
    UTILS
    --------------------------------------------
    */
    // Panel Utils
    _populateSavedSearchCriteria : function()
    {
        this._ignoreDatePickerChange = true;
        var formData = this._savedSearchCriteria;
        this._$processNames.select2("val", formData.processNames);
        this._setupTasksSelect2(formData.taskObjs, {results:formData.tasks});
        this._$ownerNames.select2("data", formData.ownerObjs);
        this._$outletNames.select2("data", formData.outletObjs);
        this._$processInstanceId.val(formData.processInstanceId);
        this._$createdFrom.ffDateInput("setJSONStringDateValue", formData.fromCreatedDate);
        this._$createdTo.ffDateInput("setJSONStringDateValue", formData.toCreatedDate);
        this._$updatedFrom.ffDateInput("setJSONStringDateValue", formData.fromUpdatedDate);
        this._$updatedTo.ffDateInput("setJSONStringDateValue", formData.toUpdatedDate);
        this._$savedSearchName.val(formData.savedSearchName);
        this._showPanelPreloader(false);
        this._ignoreDatePickerChange = false;
    },
    _positionAndAnimatePanelIn : function()
    {
        var $advancedSearchPanel    = this._$advancedSearchPanel;
        var $searchField            = this._$mainSearchField;
        var pos			            = $searchField.offset();

        this._$advancedSearchForm.css("display", "block");
        this._$advancedSearchSaveForm.css("display", "none");

        $advancedSearchPanel.css("top", pos.top + $searchField.height());
        $advancedSearchPanel.css("left", pos.left);
        $advancedSearchPanel.css("width", $searchField.parent().width());
        $advancedSearchPanel.css("visibility", "visible");
        $advancedSearchPanel.css("display", "block");
        $advancedSearchPanel.removeClass("fadeOutUp animation150ms");
        //$advancedSearchPanel.addClass("fadeInDown animation200ms");
    },
    _resetForms : function()
    {
        this._ignoreDatePickerChange = true;
        this._$advancedSearchForm[0].reset();
        this._$advancedSearchSaveForm[0].reset();
        this._$processNames.select2("val", "");
        this._$taskNames.select2("val", "");
        this._setupTasksSelect2();
        this._$ownerNames.select2("val", "");
        this._$outletNames.select2("val", "");
        this._$searchText.val(this._getSearchFieldTextOnly());
        this._setSearchFieldTextOnly(this._getSearchFieldTextOnly());
        this._$createdFrom.ffDateInput("setDateValue", null);
        this._$createdTo.ffDateInput("setDateValue", null);
        this._$updatedFrom.ffDateInput("setDateValue", null);
        this._$updatedTo.ffDateInput("setDateValue", null);
        this._ignoreDatePickerChange = false;
    },

    // Search Mode States
    _goIntoAdvancedORSavedSearchMode : function(enable)
    {
        this._log("_goIntoAdvancedORSavedSearchMode - enable: " + enable);
        if (enable == true) {
            this._getSearchFieldDivWrapper().on("click", $.proxy(this._handleAdvancedSearchModeSearchFieldClick, this));
        }
        else {
            this._getSearchFieldDivWrapper().off("click", $.proxy(this._handleAdvancedSearchModeSearchFieldClick, this));
        }
    },
    _goIntoShowingAdvancedSearchPanelMode : function (enable)
    {
        if (enable == true) {
            this._getSearchFieldDivWrapper().on("click", $.proxy(this._handleAdvancedSearchPanelShowing_searchFieldClick, this));
        }
        else {
            this._getSearchFieldDivWrapper().off("click", $.proxy(this._handleAdvancedSearchPanelShowing_searchFieldClick, this));
        }
    },
    _getState : function()
    {
        var $searchField = this._$mainSearchField;
        if ($searchField.select2("val").length == 0) {
            return this._DEFAULT_STATE
        }
        else if ($searchField.select2("val") == this._locale.advancedSearch) {
            return this._ADVANCED_SEARCH_STATE;
        }
        else {
            return this._SAVED_SEARCH_STATE;
        }
    },

    // Animation
    _showSearchForm : function(show)
    {
        if (show) {
            this._$advancedSearchForm.css("display", "block");
            this._$advancedSearchFormHolder.css("height", "auto");
            var newHeight = this._$advancedSearchFormHolder.height();
            this._$advancedSearchFormHolder.height(this._prevSearchFormHeight); //.animate({height: newHeight}, {duration:100});

            this._$advancedSearchForm.addClass("fadeInLeft animation200ms");
            this._$searchText.focus();
            setTimeout($.proxy(function(){
                this._$advancedSearchForm.removeClass("fadeInLeft animation200ms");
            }, this), 200);
        }
        else {
            this._$advancedSearchForm.addClass("fadeOutLeft animation150ms");
            setTimeout($.proxy(function(){
                this._prevSearchFormHeight = this._$advancedSearchFormHolder.height();
                this._$advancedSearchForm.css("display", "none");
                this._$advancedSearchForm.removeClass("fadeOutLeft animation150ms");
            }, this), 150);
        }
    },
    _showSaveForm : function(show)
    {
        if (show) {
            this._$advancedSearchSaveForm.css("display", "block");
            this._$advancedSearchFormHolder.css("height", "auto");
            var newHeight = this._$advancedSearchFormHolder.height();
            this._$advancedSearchFormHolder.height(this._prevSearchFormHeight); //.animate({height: newHeight}, {duration:100, ease:"ease"});

            this._$advancedSearchSaveForm.addClass("fadeInRight animation200ms");
            this._$savedSearchName.focus();

            setTimeout($.proxy(function(){
                this._$advancedSearchSaveForm.removeClass("fadeInRight animation200ms");
            }, this), 200);
        }
        else {
            this._$advancedSearchSaveForm.addClass("fadeOutRight animation150ms");
            setTimeout($.proxy(function(){
                this._$advancedSearchSaveForm.css("display", "none");
                this._prevSearchFormHeight = this._$advancedSearchFormHolder.height();
                this._$advancedSearchSaveForm.removeClass("fadeOutRight animation150ms");
            }, this), 150);
        }
    },

    // Form Data
    _getFormData : function()
    {
        var formData = {};
        if (this._hasBeenSetup) {
            formData                = shared.FormUtils.serialiseForm(this._$advancedSearchForm);
            formData.processNames   = this._$processNames.select2("val");
            formData.taskNames      = this._$taskNames.select2("val");
            formData.ownerNames     = this._$ownerNames.select2("val");
            formData.outletNames    = this._$outletNames.select2("val");
        }
        return formData;
    },
    _getFormHasData : function(formData)
    {
        var nullChecks = [
            formData.fromCreatedDate,
            formData.toCreatedDate,
            formData.fromUpdatedDate,
            formData.toUpdatedDate,
            formData.processInstanceId
        ];
        var arrChecks = [
            formData.ownerNames,
            formData.outletNames,
            formData.processNames,
            formData.taskNames
        ];

        var formHasData = _.find(nullChecks, function(item){ return (item != null && item != " "); });
        if (formHasData == undefined) {
            formHasData = _.find(arrChecks, function(item){ return (item != null && item.length != 0); });
        }
        return (formHasData != null);
    },
    _getSavedSearchMatchesFormData : function(formData)
    {
        if (this._savedSearchCriteria != null) {
            var savedSearchFormData = this._savedSearchCriteria;
            var datePropNames       = ["fromCreatedDate","fromUpdatedDate","toCreatedDate","toUpdatedDate"];
            var strings             = ["processInstanceId", "searchText"];
            var i;

            for (i = 0; i<datePropNames.length; i++) {
                var datePropStr     = datePropNames[i];
                var datesAreEqual   = this._areDatesEqual(formData[datePropStr], savedSearchFormData[datePropStr]);
                if (!datesAreEqual) {
                    return false;
                }
            }

            if (formData.processInstanceId != savedSearchFormData.processInstanceId ||
                formData.searchText != savedSearchFormData.searchText) {
                return false;
            }

            if (!this._namesAndObjsAreEqual(formData.outletNames, savedSearchFormData.outletObjs)) {
                return false;
            }
            if (!this._namesAndObjsAreEqual(formData.ownerNames, savedSearchFormData.ownerObjs)) {
                return false;
            }
            if (!this._namesAndObjsAreEqual(formData.taskNames, savedSearchFormData.taskObjs)) {
                return false;
            }

            if (formData.processNames.length != savedSearchFormData.processNames.length) {
                return false;
            }
            var processNameHash = [];
            _.each(savedSearchFormData.processNames, $.proxy(function(name){
                processNameHash[name] = true;
            }, this));
            for (i = 0; i<formData.processNames.length; i++) {
                var processName = formData.processNames[i];
                if (!processNameHash[processName]) {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    },
    _areDatesEqual : function(dateStr1, dateStr2)
    {
        if (dateStr1 == null || dateStr2 == null) {
            return false;
        }
        var dateParts1  = dateStr1.split("-");
        var date1       = new Date(dateParts1[0], Number(dateParts1[1]) - 1, dateParts1[2], 0, 0, 0, 0);
        var dateParts2  = dateStr2.split("-");
        var date2       = new Date(dateParts2[0], Number(dateParts2[1]) - 1, dateParts2[2], 0, 0, 0, 0);
        return (date1 == date2);
    },
    _namesAndObjsAreEqual : function(names, objs)
    {
        if (names.length != objs.length) {
            return false;
        }
        var objsHash = _.hashify("id", objs);
        for (var i = 0; i<names.length; i++) {
            var name = names[i];
            if (!objsHash[name]) {
                return false;
            }
        }
        return true;
    },

    // UI Utils
    _showValidation : function(msg, $focusComp)
    {
        this._popupShowing = true;
        this._ignoreNextBodyClick = true;
        shared.PopupManager.showValidation(msg, null, $.proxy(function(){
            if ($focusComp) {
                $focusComp.focus();
            }
            this._popupShowing = false;
        }, this));
    },
    _adaptUIToCaterForShowPanel : function(show)
    {
        if (show) {
            this._$mainSearchHolder.find(".select2-choices").removeClass("borderBottomLeftRadiusNormal").addClass("borderBottomLeftRadius0");
            this._$mainSearchHolder.find(".downBtn").removeClass("borderBottomRightRadiusNormal").addClass("borderBottomRightRadius0");
            this._$mainSearchIcon.css("display", "none");
        }
        else {
            this._$mainSearchHolder.find(".select2-choices").removeClass("borderBottomLeftRadius0").addClass("borderBottomLeftRadiusNormal");
            this._$mainSearchHolder.find(".downBtn").removeClass("borderBottomRightRadius0").addClass("borderBottomRightRadiusNormal");
            this._$mainSearchIcon.css("display", "inline");
        }
    },
    _showProcessesPreloader : function(show)
    {
        this._$mainSearchHolder.find(".spinner").css("display", (show) ? "inline" : "none");
    },
    _showPanelPreloader : function(show)
    {
        this._$advancedSearchPanel.find(".advancedSearchModal").css("display", (show) ? "block" : "none");
    },

    // Default Closures
    _defaultAjaxSearch : function(url)
    {
        return {
            url         : url,
            dataType    : 'json',
            data        : this._defaultDataFunc,
            results     : this._defaultResultsFunc
        }
    },
    _defaultInitSelectionFunc : function(element, callback)
    {
        var data = [];
        $(element.val().split(",")).each(function (item) {
            data.push({id: item.id, text: item.text});
        });
        callback(data);
    },
    _defaultDataFunc : function(term, page)
    {
        return {term:term};
    },
    _defaultResultsFunc : function(data, page)
    {
        return (data.data != null) ? {results: data.data} : {results:[]};
    },


    _log : function(msg)
    {
        if (this._showConsoleLogs) {
            console.log(msg);
        }
    }
};