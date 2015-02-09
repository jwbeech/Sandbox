$.fn.ffDataTable = shared.plugins.PluginBuilder.generatePlugin("ffDataTable", {
    // PUBLIC PROPERTIES
    columns                 : null,
    initialized             : false,

    // PRIVATE PROPERTIES
    _empty                  : '<div class="emptyCell">----</div>',
    _currencySymbol         : null,

    _paginationURL          : null,
    _paginationData         : null,
    _paginationPreloader    : null,
    _paginationAjax         : null,
    _recordsTotal           : null,
    _minLines               : null,
    _ignoreNextReload       : false,
    _lastPageDataSet        : null,

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    initialize : function()
    {
        this._currencySymbol    = $.fn.ffDataTable.defaults.currencySymbol;

        if (!$.fn.ffDataTable.defaults.isInitialized) {
            $.fn.ffDataTable.defaults.isInitialized = true;
            var empty           = this._empty;

            // Custom sorting method for currency
            $.extend(jQuery.fn.dataTableExt.oSort, {
                "currency-asc": function (x, y) {
                    //console.log("currency-asc");
                    x = cleanCurrency(x);
                    y = cleanCurrency(y);
                    return x - y
                },
                "currency-desc": function (x, y) {
                    //console.log("currency-desc");
                    x = cleanCurrency(x);
                    y = cleanCurrency(y);
                    return y - x;
                },

                "customsorting-asc" : function(x, y){
                    if (x == empty || y == empty) return emptyAsc(x,y);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                },
                "customsorting-desc" : function(x, y){
                    if (x == empty || y == empty) return emptyDesc(x, y);
                    return ((x < y) ? 1 : ((x > y) ? -1 : 0));
                }
            });

            function emptyDesc(x,y){
                if (x == y) return 0;
                else if (x == empty && y != empty) return 1;
                else if (x != empty && y == empty) return -1;
            }

            function emptyAsc(x,y){
                if (x == y) return 0;
                else if (x == empty && y != empty) return 1;
                else if (x != empty && y == empty) return -1;
            }

            function cleanCurrency(a){
                a = (a || "");
                a = (a==="-") ? 0 : a.replace( /[^\d\-\.]/g, "" );
                return parseFloat( a );
            }
        }
        $("body").on("click", $.proxy(this._actionOutListener, this));
    },

    createTable: function(params)
    {
        // Available Configuration
        this.columns    	    = params.cols;
        var rows			    = params.rows;
        var columnDefs  	    = params.columnDefs;
        var generatedTableHTML  = (this.columns == null && rows == null);   // Boolean  - True if no rows or cols have been supplied. IE. The html for the table has already been generated.
        var search              = params.search;                    // Boolean  - Show the search TextInput or not
        var minLines 		    = params.minLines;		            // Number	- The minimum lines to be shown - if less blank ones will be created
        this._minLines          = params.minLines;
        var maxLines		    = params.maxLines;		            // Number	- The maximum allowed lines before pagination must kick in. NOTE: Must be used in conjunction with pagination:true
        var maxHeightLines      = params.maxHeightLines;            // Number   - The maximum height (in terms of lines) the table can be
        var reOrder			    = params.reOrder;		            // Boolean 	- Allows columns to be reordered
        var sort			    = params.sort;			            // Boolean	- Allows columns to sort the data
        var pagination		    = params.pagination;	            // Boolean	- Enables pagination - only if needed
        var aaSorting		    = params.aaSorting;		            // Array	- https://datatables.net/ref - aaSorting: [[1, "asc"]]
        var hscroll             = params.hscroll;                   // Boolean  - Enable/Disable horizontal scrolling
        var rightTargets        = params.rightTargets;              // Array    - An array of column indexes that should be right aligned
        var tableBuiltCallback  = params.tableBuiltCallback;        // Function - A function to be called once the table has been built
        var rowCallback         = params.rowCallback;               // Function - A function to be called when a row has been created
        var headerCallback      = params.headerCallback;            // Function - A function to be called when a header has been created
        var rowReordering       = params.rowReordering;             // Boolean  - Allows rows to be reordered with drag and drop
        var rowReorderingURL    = params.rowReorderingURL;          // String   - The URL that handles changes to the row order
        var iIndexColumn        = (params.iIndexColumn != null) ? params.iIndexColumn : 0;  // Number - The column to use as the source for the sort index
        var tableClasses        = params.tableClasses;              // String   - A space separated list of CSS classes to add to the main table
        var useSubObjectHeader  = params.useSubObjectHeader;        // Boolean  - If true "headerRow" class is added to every row
        var serverSide          = params.serverSide;                // Boolean  - If true server side pagination is used: If true the next property is required, then either paginationURL or ajax
        this._paginationURL     = params.paginationURL;             // String   - URL to use to reload items for pagination
        this._paginationData    = params.paginationData;            // Function - A function to call that should return any properties to be added to the pagination call
        this._paginationPreloader   = (params.paginationPreloader != null ? params.paginationPreloader : true);   // Boolean - Defaults to true. If true shows a preloader over the table when paginating
        this._recordsTotal      = params.recordsTotal;              // Number   - The total pagination number
        var start               = params.start;                     // Number   - The offset to start the pagination at, defaults to 0
        this._paginationAjax    = params.ajax;                      // Function - A callback to replace the auto pagination ajax method
        var sScrollX            = params.sScrollX;                  // Percentage   - e.g. "250%", used for horizontal scrolling this is the size of the inner table in relation to its container, wider means less wrapping.
        var incrementRight      = params.incrementRightTargets;     // Boolean  - If true all right targets will be incremented by 1
        var drawCallback        = params.drawCallback;              // Function - Callback to be executed everytime the table draws
        var freezeCols          = params.freezeCols;                // Number   - The amount of left columns to freeze

        if (rowReordering == true && rowReorderingURL == null) {
            throw new Error("rowReorderingURL is required when rowReordering is enabled")
        }
        if (this.$el.attr("id") == null){
            throw new Error("Please make sure your table has an id, its required to make unique row ids");
        }
        if (incrementRight === true && params.rightTargets != null){
            params.rightTargets = this.incrementRightTargets(params.rightTargets)
        }
        // Fix to make sure DT doesnt make unorderable column the default sort
        if (this.columns && this.columns.length > 0 && this.columns[0].orderable == false && aaSorting == null){
            aaSorting = [[1, "asc"]];
        }
        _.each(rightTargets, $.proxy(function(element){
            if (element > this.columns.length-1) {
                throw new Error("Please make sure your right targets don't target columns not available in your column list");
            }
        }, this));
        var maxHeight;
        if (maxHeightLines) {
            maxHeight = (maxHeightLines*25) + 1;
        }

        // Setup Styles
        this.$el.attr("cellpadding", 0);
        this.$el.attr("cellspacing", 0);
        this.$el.attr("border", 0);
        this.$el.addClass((tableClasses != null) ? tableClasses : "");
        this.$el.addClass("table table-striped table-bordered ffDataTable");


        // right target generation from columns
        if (rightTargets == null){
            var newTargets = [];
            _.each(this.columns, function(item, index){
                if (item && item.hasOwnProperty("right") && item.right === true) newTargets.push(index);
            });
            if (newTargets.length > 0) rightTargets = newTargets;
        }

        if (rightTargets) {
            if (!columnDefs) columnDefs = [];
            columnDefs.push({targets:rightTargets, createdCell: function (td, cellData, rowData, row, col) { $(td).css('text-align', 'right'); }});
        }

        // We use custom sorting method for all columns
        // This is so we can manually cater for empty columns
        if (!columnDefs) columnDefs = [];
        var customCol   = {type:"customsorting", targets:[]};
        var currency    = {type:"currency", targets:[]};
        columnDefs.push(customCol);
        columnDefs.push(currency);

        // To support ComponentsTagLib implementation of the plugin when cols aren't supplied
        if (!generatedTableHTML) {
            for (var i = 0; i < this.columns.length; i++) {
                var testVal = (this.columns[i].data && rows && rows.length > 0) ? rows[0][this.columns[i].data] : null;
                if (testVal && this._isCurrency(testVal)){
                    currency.targets.push(i);
                }
                else{
                    customCol.targets.push(i);
                }
            }
        }


        var dom 			= (reOrder)? "R" : "";
        dom                 += (search)? "<f>" : "";
        dom				    += "<t><p>";
        if (!rows && !generatedTableHTML) rows = [];

        // Add extra rows to fill the min lines
        if (!generatedTableHTML) {
            var hidePagination  = (rows.length <= minLines);
            if (serverSide){
                hidePagination  = this._recordsTotal <= rows.length;
            }
            if (rows.length < minLines) rows = this._addExtraRows(minLines, rows, this.columns);

            // Fix the records total, this will happen when there are 0 results but min lines
            if (this._recordsTotal == 0){
                this._recordsTotal  = this._minLines;
            }
        }

        var dtParams = {
            // R - reordering functionality
            // < - open div
            // t - The actual Table
            // > - close div
            // p - Pagination
            dom             : dom,
            autoWidth       : false,
            ordering        : sort,
            scrollCollapse  : (maxHeight != null),

            //columns         : this.columns,
            //data            : rows,

            processing      : serverSide,
            serverSide      : serverSide,

            columnDefs      : columnDefs,
            paging          : pagination,

            fnDrawCallback  : $.proxy(this._fnDrawCallback, this, {drawCallback:drawCallback}),

            oLanguage       : {sSearch:""},
            rowCallback     : $.proxy(this._rowCallback, this, {prefix:this.$el.attr("id"), index:0, applyId:rowReordering, rowCallback:rowCallback}),
            headerCallback  : $.proxy(this._headerCallback, this, {useSubObjectHeader:useSubObjectHeader}),

            // Non-DataTable params for use in repopulate
            __minLines              : minLines,
            __paginationRequested   : pagination,
            __rowReordering         : rowReordering,
            __rowReorderingURL      : rowReorderingURL,
            __tableBuiltCallback    : tableBuiltCallback,
            __freezeCols            : freezeCols
        };
        if (pagination === true){
            dtParams.displayStart   = start || 0;
        }
        if (!generatedTableHTML) {
            dtParams.columns = this.columns;
            dtParams.data = rows;
        }
        if (serverSide){
            dtParams.ajax   = $.proxy(this._paginationLoadListener, this)
        }
        if (this._recordsTotal)   dtParams.deferLoading   = this._recordsTotal;
        // TODO: Remove once the fix for this has been implemented: https://qualica.atlassian.net/browse/FIN-9821
        if (freezeCols != null) dtParams.deferLoading = null;

        if (maxLines)       dtParams.iDisplayLength = maxLines;
        if (maxHeight)      dtParams.sScrollY       = maxHeight;
        if (aaSorting)      dtParams.aaSorting      = aaSorting;
        if (rowCallback)    dtParams.rowCallback    = rowCallback;
        if (headerCallback) dtParams.headerCallback = headerCallback;

        if (hscroll){
            dtParams.sScrollX			= (sScrollX != null) ? sScrollX : "100%";
            dtParams.bScrollCollapse	= true;
        }

        // Store initialized so we know about the table
        this.initialized = true;

        if (rowReordering) {
            dtParams.ordering   = true;
            this.$el.dataTable(dtParams).rowReordering({iIndexColumn:iIndexColumn});
            this.$el.removeClass("reorderingTable").addClass("reorderingTable").findParentByClass("dataTables_scroll").removeClass("reorderingTable").addClass("reorderingTable");
            this.$el.on("rowReordering.dt", $.proxy(function(event, iCurrentPosition, iNewPosition, id, rowData){
                var data = this.getData();
                $.ajax({
                    url     : rowReorderingURL,
                    type    : "POST",
                    data    : {data:JSON.stringify(data)},
                    success : $.proxy(function(json) {
                        if (json.data) this.repopulateData(json.data.rows);
                    }, this)
                });
            }, this));
        }
        else {
            this.$el.DataTable(dtParams);
        }
        if (freezeCols != null) {
            new $.fn.dataTable.FixedColumns(this.$el.DataTable(), {leftColumns:freezeCols});
        }
        // Apply a class to hide the pagination
        if (hidePagination) {
            this._showPagination(false);
        }

        if (tableBuiltCallback != null) tableBuiltCallback();
        this.$el.trigger("tableBuilt");

        // Add a listener for all scroll events
        this._findFromWrapper(".dataTables_scrollBody").scroll($.proxy(this._actionOutListener, this));
        // Add listener for action button events
        this._getParentWrapper().on("click", ".actionsBtn", $.proxy(this._actionsClickListener, this));
    },

    createOrRepopulate : function(params){
        if (this.initialized === false){
            this.createTable(params);
        }
        else{
            this.repopulateData(params.rows);
        }
    },

    reload : function(resetPaging, callback){
        var doResetPaging = (resetPaging == true);
        this.$el.DataTable().ajax.reload(callback, doResetPaging);
    },

    recalculateColumns : function(){
        console.log("recalculateColumns called");
        this._ignoreNextReload = true;
        this.$el.DataTable().columns.adjust().draw();
    },



    /*
    CREATION
    --------------------------------------------
    */
    createTableWithRadio: function(radioButtonGroupName, params, incrementRightTargets)
    {
        var $selector = this.$el;
        //if (params.rows && params.rows.length > 0){
        params.cols.unshift({
            data        : "selected",//function(source, type, val) { return {selected:source.selected, id:source.id}; },
            width       : 26,
            orderable   : false,
            render      : function (data, type, full ) {
                // Create the data property
                if (!full.hasOwnProperty("selected")) full.selected = false;

                if (!(full.isEmpty == true) && full.id != null){
                    var checked = (full.selected == true) ? ' checked="checked"' : '';
                    return '<input type="radio"' + checked + ' data-id="' + full.id + '" name="' + radioButtonGroupName + '" />';
                }
                else{
                    return ""
                }
            }
        });
        //}

        if (incrementRightTargets === true && params && params.rightTargets){
            params.rightTargets = this.incrementRightTargets(params.rightTargets);
        }

        params.tableClasses = "radioButtonTable";
        this.createTable(params);

        $selector.find("input[type=radio]:checked").closest("tr").addClass('selectedRadioRow');
        $selector.find("tbody").on("click", "tr", $.proxy(function(e){
            var $row        = $(e.currentTarget);
            var $radio      = $row.find("input[type=radio]");
            var selectedId  = $radio.attr("data-id");
            if ($radio.length != 0) {
                $radio.prop("checked", true);
                $radio.change();
                $selector.find('tr.selectedRadioRow').removeClass('selectedRadioRow');
                $row.addClass('selectedRadioRow');

                // Update the data locally
                _.each(this.getData(), function(item){ item.selected = (item.id == selectedId); });
            }
        }, this));
    },

    createTableSelectAll: function(tableHolderSelector, tableSelector, selectAllSelector, selectColHeaderHTML, singleSelectCallback, selectAllCallback, params)
    {
        // Add the checkbox column header HTML
        if (selectColHeaderHTML != null) {
            var headerHTML = '<thead><tr><th>' + selectColHeaderHTML + '</th>';
            for (var i = 0; i < params.cols.length; i++) {
                headerHTML += '<th></th>';
            }
            headerHTML += '</tr></thead>';
            $(tableSelector).html(headerHTML);
        }

        // Add a checkbox for every line in the first column
        params.cols.unshift({
            data        : "selected",
            width       : 26,
            orderable   : false,
            render      : function ( data, type, full ) {
                if (!full.hasOwnProperty("selected")) full.selected = false;
                if (!(full.isEmpty == true) && full.id != null){
                    var checked = (full.selected == true) ? ' checked="checked"' : '';
                    return '<input type="checkbox"' + checked + ' data-id="' + full.id + '" />';
                }
                else{
                    return "";
                }
            }
        });

        // Handle checkbox change
        if (singleSelectCallback != null) {
            $(tableHolderSelector).off();
            $(tableHolderSelector).on("click", "input[type='checkbox']", $.proxy(function(event){
                var $target		= $(event.target);
                if ($target.attr("data-id") != null) {
                    this.showPreloader($target);
                    // Prefix added to select the correct checkbox when the frozen columns are added as the header is duplicated.
                    var $selectAll = (params.freezeCols != null) ? $(".DTFC_LeftWrapper " + selectAllSelector) : $(selectAllSelector);
                    this.singleCheckbox_updateDataLocally($target, $selectAll);
                    singleSelectCallback($target.attr("data-id"), $target.prop("checked"), $.proxy(function(){
                        this.hidePreloader($target);
                    }, this));
                }
            }, this));
        }

        if (selectAllSelector != null) {

            // Handle Select All
            var $selectAll  = $(selectAllSelector);
            $selectAll.off();
            $selectAll.click($.proxy(function(event) {
                // Prefix added to select the correct checkbox when the frozen columns are added as the header is duplicated.
                var $selectAll = (params.freezeCols != null) ? $(".DTFC_LeftWrapper " + selectAllSelector) : $(selectAllSelector);
                var $target		= $(event.target);
                var $checkboxes = $(tableHolderSelector + " input[type='checkbox']");
                // Don't send an update if the table is empty
                if ($checkboxes.length > 1) {
                    if (selectAllCallback != null) {
                        this.showPreloader($target, $checkboxes);
                        this.selectAllCheckbox_updateDataLocally($selectAll);
                        selectAllCallback($target.prop("checked"), $.proxy(function(){
                            this.hidePreloader($target, $checkboxes);
                        }, this));
                    }
                    else {
                        this.selectAllCheckbox_updateDataLocally($selectAll);
                    }
                }
            }, this));

            // Populate the select all
            this.$el.off("tableBuilt").on("tableBuilt", $.proxy(function(e){
                var allSelected = true;
                var data        = this.getData();
                for (var i = 0; i < data.length; i++){
                    if (data[i].selected != true){
                        allSelected = false;
                        break;
                    }
                }
                $selectAll.prop("checked", allSelected);
            }, this));
        }

        this.createTable(params);
    },

    repopulateData: function(rows)
    {
        var $selector   = this.$el;
        var settings    = $selector.dataTable().fnSettings().oInit;

        // Add extra rows to fill the min lines
        var showPagination = !(rows.length <= settings.__minLines);
        if (rows.length <= settings.__minLines){
            rows = this._addExtraRows(settings.__minLines, rows, settings.columns);
        }

        $selector.DataTable().clear().rows.add(rows).draw();

        // Add or remove a class to hide the pagination
        var parent = $selector.findParentByClass("dataTables_wrapper");
        if (settings.__paginationRequested && showPagination) {
            parent.removeClass("hidePagination")
        }
        else{
            parent.addClass("hidePagination");
        }

        // Execute the callback if populated
        if (settings.__tableBuiltCallback != null) settings.__tableBuiltCallback();
        this.$el.trigger("tableBuilt");
    },

    repopulateMaxLines : function(maxLines, setMinLines){
        var API = this.$el.DataTable();
        API.context[0]._iDisplayLength = maxLines;
        if (setMinLines === true){
            this.$el.dataTable().fnSettings().oInit.__minLines = maxLines;
            this.repopulateData(this.getData());
        }
        else{
            API.draw();
        }
    },

    /*
    UPDATES & UTILS
    --------------------------------------------
    */
    singleCheckbox_updateDataLocally: function($singleCheckboxSelector, $selectAllSelector)
    {
        var $dataTableSelector = this.$el;
        var allSelected = $singleCheckboxSelector.prop("checked");
        var settings = $dataTableSelector.dataTable().fnSettings();
        for (var i = 0; i<settings.aoData.length; i++) {
            if (settings.aoData[i]._aData.id == $singleCheckboxSelector.attr("data-id")) {
                settings.aoData[i]._aData.selected = $singleCheckboxSelector.prop("checked");
            }
            if (!settings.aoData[i]._aData.selected) {
                allSelected = false;
            }
        }
        $selectAllSelector.prop('checked', allSelected);
    },

    // Cols and rows are needed because of the issue mentioned in the commented out method below updateData()
    selectAllCheckbox_updateDataLocally: function($selectAllSelector)
    {
        var $dataTableSelector  = this.$el;
        var checked             = $selectAllSelector.prop('checked');
        var data                = $dataTableSelector.DataTable().data();
        var newSet              = [];
        for (var i = 0; i < data.length; i++) {
            if (!this.isCellEmpty(data[i])){
                data[i].selected = checked;
                newSet.push(data[i]);
            }
        }
        this.repopulateData(newSet);
    },

    hidePaginationIfNotEnoughItems : function(totalItems)
    {
        var dataTable = this.$el.dataTable();
        var settings = dataTable.fnSettings();
        if (totalItems <= settings.oInit.__minLines) {
            this._showPagination(false);
        }
        else {
            this._showPagination(true);
        }
    },

    showPreloader: function($checkbox, $checkboxes)
    {
        $checkbox.css("display", "none");
        $checkbox.parent().append($.fn.ffDataTable.defaults.checkboxPreloader);
        if ($checkboxes != null) {
            $checkboxes.prop("disabled", true);
        }
    },

    hidePreloader: function($checkbox, $checkboxes)
    {
        $checkbox.css("display", "inline");
        $checkbox.parent().find("img").remove();
        if ($checkboxes != null) {
            $checkboxes.prop("disabled", false);
        }
    },


    /**
     * Selects a certain row in a radio button table based on the data id of that row
     * @param selectedId The id to change to
     * @param dispatchChange If true change event will be triggered
     */
    setRadioTableSelection : function(selectedId, dispatchChange){
        // First try remove any selection
        var $selectedRadio = this.$el.find("input[type=radio]:checked");
        if ($selectedRadio.length > 0) {
            $selectedRadio.prop("checked", false);
            $selectedRadio.closest("tr").removeClass("selectedRadioRow");
        }

        // Now update the source data
        var data = this.getData();
        _.each(data, function(item){
            if (item && item.hasOwnProperty("id")){
                item.selected = item.id == selectedId;
            }
        });

        // Now try and select the right radio, it may not be drawn onto the current page
        var $toSelect = this.$el.find("input[data-id='" + selectedId + "']");
        if ($toSelect.length > 0){
            $toSelect.prop("checked", true);
            $toSelect.closest("tr").addClass("selectedRadioRow");
            if (dispatchChange === true){
                $selectedRadio.change();
            }
        }
    },

    /**
     * @deprecated Please use standalone methods in shared.EventHandler
     */
    setupTableButtons : function(tabCollectionId, tabId, moduleId, editSelector, deleteSelector, viewSelector, addSelector, deleteMessage)
    {
        this.setupDelegatedTableButtons(tabCollectionId, tabId, moduleId, null, editSelector, deleteSelector, viewSelector, addSelector, deleteMessage)
    },

    /**
     * @deprecated Please use standalone methods in shared.EventHandler
     * Attaches table listeners for deleting and showing popups.
     * If parentSelector is not null it attaches delegated events but this is not required.
     */
    setupDelegatedTableButtons : function(tabCollectionId, tabId, moduleId, parentSelector, popupSelector, deleteSelector, viewSelector, addSelector, deleteMessage)
    {
        var frm = workbox.ModuleRequestFramework.retrieveInstance(tabCollectionId, tabId);

        function viewPopup(prop, e){
            e.preventDefault();
            var $this   = $(e.target);
            var url     = frm.updateURLForModule($this.attr(prop), moduleId);
            shared.PopupManager.loadAndShowPopup(url);
        }

        function runDelete(e){
            e.preventDefault();
            shared.PopupManager.showConfirmation(deleteMessage, $.proxy(function(selectedBtn){
                if (selectedBtn == shared.PopupManager.BUTTON_YES){
                    frm.runDirectCall(moduleId, $(this).attr("href"));
                }
                else{
                    console.log("Delete declined");
                }
            }, this));
        }
        function notNull(element) { return (element != "" && element != null) }

        if (notNull(parentSelector)){
            if (notNull(popupSelector))     $(parentSelector).on("click", popupSelector, $.proxy(viewPopup, this, "href"));
            if (notNull(viewSelector))      $(parentSelector).on("click", viewSelector, $.proxy(viewPopup, this, "href"));
            if (notNull(addSelector))       $(parentSelector).on("click", addSelector, $.proxy(viewPopup, this, "data-url"));
            if (notNull(deleteSelector))    $(parentSelector).on("click", deleteSelector, runDelete);
        }
        else{
            if (notNull(popupSelector))      $(popupSelector).click($.proxy(viewPopup, this, "href"));
            if (notNull(viewSelector))      $(viewSelector).click($.proxy(viewPopup, this, "href"));
            if (notNull(addSelector))       $(addSelector).click($.proxy(viewPopup, this, "data-url"));
            if (notNull(deleteSelector))    $(deleteSelector).click(runDelete);
        }
    },

    /**
     * @deprecated
     */
    getRenderTablePopupLink : function(dataProps, linkClasses, linkNames, targets){
        return this.getRenderLinkFunction(dataProps, linkClasses, linkNames, targets)
    },

    /**
     * Utility to return a function used to render a specific links in a cell
     * @param dataProps {Array} A list of property names to look for in the row's data
     * @param linkClasses {Array} A list of classes to use for the links rendered
     * @param linkNames {Array} A list of localised names to use for the link text
     * @param targets {Array} An optional list of targets to use in the link's. i.e. target="_blank"
     * @param additionalRenderFunction {Function} An optional function to execute to render additional info to the cell
     * @returns {Function}
     */
    getRenderLinkFunction : function(dataProps, linkClasses, linkNames, targets, additionalRenderFunction){
        return function (data, type, full) {
            var result = "";
            if (full.isEmpty == true) return "";
            _.each(dataProps, function(prop, i){
                if (full[prop] != null) {
                    var target      = (targets && targets[i]) ? 'target="' + targets[i] + '"' : '';
                    var dataIdAttr  = (full.id) ? 'data-id="' + full.id + '"' : '';
                    result          += "<a role='button' class='" + linkClasses[i] + " btn-table btn' href='" + full[prop] + "' " + target + " " + dataIdAttr + ">" + linkNames[i] + "</a>\r";
                }
            }, this);
            if (additionalRenderFunction){
                result  += additionalRenderFunction(data, type, full);
            }
            return result;
        }
    },

    /**
     * Renders an "actions" link with its associated menu
     * @param dataProps {Array} A list of property names to look for in the row's data to use as links in the menu
     * @param linkClasses {Array} A list of classes to use for the links rendered in the menu
     * @param linkNames {Array} A list of localised names to use for the link text rendered in the menu
     * @param targets {Array} An optional list of targets to use in the link's. i.e. target="_blank"
     * @param additionalRenderFunction {Function} An optional function to execute to render additional info to the cell
     * @param renderToRight {Boolean} If true the list will render to the right of the button
     * @param actionLabel {String} If populated used as the name for the action link, defaults to "global.actions"
     */
    getRenderActionsLink : function(dataProps, linkClasses, linkNames, targets, additionalRenderFunction, renderToRight, actionLabel){
        return function(data, type, full){
            var result = "";
            if (full.isEmpty == true) return "";
            var menuId  = _.uniqueId("actionsMenu_");
            result      = '<div class="btn-group">\r';
            result      += '<a role="button" class="btn-table btn actionsBtn" data-menu-id="' + menuId + '">' +  (actionLabel ? actionLabel : Locale.get("global.actions")) + '&nbsp;&nbsp;<span class="caret"></span></a>';
            result      += '<ul id="' + menuId + '" class="dropdown-menu actions-menu ' + (renderToRight == null || renderToRight == false ? 'actions-menu-right' : '') + '" role="menu">\r';
            var hasEntries = false;
            _.each(dataProps, function(prop, i){
                if (full[prop] != null) {
                    var target      = (targets && targets[i]) ? 'target="' + targets[i] + '"' : '';
                    var dataIdAttr  = (full.id) ? 'data-id="' + full.id + '"' : '';
                    var classInfo   = (linkClasses && linkClasses[i]) ? 'class="' + linkClasses[i] + '"' : '';
                    result          += "<li><a " + classInfo + " href='" + full[prop] + "' " + target + " " + dataIdAttr + ">" + linkNames[i] + "</a></li>\r";
                    hasEntries      = true;
                }
            }, this);
            result  += '</ul></div>';
            if (!hasEntries) result = "";
            if (additionalRenderFunction){
                result      += additionalRenderFunction(data, type, full);
            }
            return result;
        }
    },

    /**
     * Returns a method to be used as a rowCallback that will add a hierarchical arrow based on a level property
     * @returns {Function}
     */
    getRenderTreeMethod : function(){
        return function (data, type, full) {
            if (full.isEmpty == true) return "";

            var result      = data;
            if (full.level > 0){
                var m       = 15;
                var pl      = (full.level * m) + "px";
                var xPos    = ((full.level - 1) * m + 5) + "px 3px";
                result      = '<div class="treeDivider" style="padding-left: ' + pl + '; background-position:' + xPos + ';">' + data + '</div>';
            }
            return result;
        };
        /*return function(row, data){
            var $name   = $(row).find("td").first();
            $name.html("<div>" + $name.html() + "</div>");
            $name       = $name.find("div");
            if (data.level > 0){
                $name.addClass("treeDivider");
                var m = 15;
                $name.css("padding-left", (data.level * m));
                var x = (data.level - 1) * m + 5;
                $name.css("background-position", x + "px 3px");
            }
        }*/
    },

    incrementRightTargets : function(rightTargets){
        for (var i = 0; i < rightTargets.length; i++) {
            rightTargets[i]++;
        }
        return rightTargets;
    },

    destroy : function(){
        if (this.initialized) {
            this.initialized = false;
            this.$el.DataTable().destroy();
        }
    },

    destroyAndRecreate : function($wrapper, newTableHTML, idSelector){
        var $current = $(idSelector);
        $current.ffDataTable().destroy();
        $current.remove();
        $wrapper.append(newTableHTML);
        return $(idSelector).ffDataTable();
    },


    /*
    GETTERS
    --------------------------------------------
    */
    getSelectedRadioRow:function()
    {
        var $selector   = this.$el;
        var id          = $selector.find("input[type=radio]:checked").attr("data-id");
        if (id != null) {
            var data    = $selector.DataTable().rows().data();
            for (var i = 0; i<data.length; i++) {
                var row = data[i];
                if (row.id == id) {
                    return row;
                }
            }
        }
        return null;
    },

    getData:function()
    {
        if (this.initialized === false) {
            console.error("this data table has not been intialised");
        }
        var raw     = this.$el.DataTable().data();
        var data    = [];
        for (var i = 0; i < raw.length; i++){
            if (raw[i].isEmpty == null || raw[i].isEmpty == false) { data.push(raw[i]) }
        }
        return data;
    },


    /**
     * Utility to find the data object related to a link in a table.
     */
    getRowDataForLink : function($link){
        var id = $link.attr("data-id");
        return this.getRowDataForId(id);
    },

    /**
     * Utility to find the data object related to an id.
     */
    getRowDataForId : function(id, idName){
        if (idName == null) idName = "id";
        if (id != null && id != ""){
            var data = this.getData();
            return _.find(data, function(item) { return item.id == id; });
        }
        return null;
    },


    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _rowCallback : function(customData, row, data){
        var $row        = $(row);

        // Apply a custom id if there is none and its needed
        if (customData.applyId && !$row.attr("id")){
            var index   = customData.index;
            $row.attr("id", customData.prefix + "_" + index);
            customData.index++;
        }

        // Hide data for empty rows
        if (data && data.hasOwnProperty("isEmpty")){
            $row.css("cursor", "default");
            //$row.find("td").html("");
        }


        if (customData.rowCallback) customData.rowCallback(row, data);
    },

    _headerCallback : function(customData, tr, data, start, end, display){
        if (customData.useSubObjectHeader){
            $(tr).addClass("headerRow");
        }
    },

    _paginationLoadListener : function(data, callback, settings){
        if (this._ignoreNextReload && this._lastPageDataSet != null){
            console.log("Running pagination call with the previous result set");
            callback(this._lastPageDataSet);
        }
        else{
            // Generate new data set
            var sendData                = {draw:data.draw, start:data.start, length:data.length, recordsTotal:this._recordsTotal, pageSize:this._minLines};
            if (data.order && data.order.length){
                sendData.orderColumnPos = data.order[0].column;
                sendData.orderColumn    = this.columns[sendData.orderColumnPos].data;
                sendData.orderDir       = data.order[0].dir;
                sendData.sortColumn     = this.columns[sendData.orderColumnPos].sortColumn;
            }

            if (this._paginationData != null){
                var otherData           = this._paginationData();
                sendData                = _.extend({}, sendData, otherData);
            }

            // Create a div that shows a preloader
            if (this._paginationPreloader){
                var id          = "#" + this.$el.attr("id") + "_wrapper";
                var preloaderId = new Date().getTime() + "_dtpreloader";
                $(id).append('<div id="' + preloaderId + '" class="modulePreloader">' + $.fn.ffDataTable.defaults.mainPreloader + '</div>');
            }


            this.$el.trigger("paginationLoadStart", data);

            if (this._paginationAjax != null){
                this._paginationAjax(sendData, $.proxy(this._handlePagination, this, callback, preloaderId), settings)
            }
            else{
                $.ajax({
                    url		: this._paginationURL,
                    type	: "GET",
                    data	: sendData,
                    success	: $.proxy(this._handlePagination, this, callback, preloaderId)
                });
            }
        }
        this._ignoreNextReload = false;
    },

    _handlePagination : function(callback, preloaderId, json){
        $("#" + preloaderId).remove();
        if (json.data) {
            if (json.data.recordsTotal) this.hidePaginationIfNotEnoughItems(json.data.recordsTotal);

            // Add extra rows to fill the min lines
            var settings = this.$el.dataTable().fnSettings().oInit;
            if (json.data.data && settings.__minLines){
                if (json.data.data.length <= settings.__minLines){
                    json.data.data = this._addExtraRows(settings.__minLines, json.data.data, settings.columns);
                }
            }
            this._lastPageDataSet = json.data;
            callback(json.data);
        }
        this.$el.trigger("paginationLoadEnd", json);
    },

    _fnDrawCallback : function(params, settings){
        this._findFromWrapper(".paginate_button.disabled a").each(function() {
            var $link = $(this);
            $link.off("click").on("click", function (e) {
                e.preventDefault();
            });
            $link.parent().off("click");
        });
        this._findFromWrapper(".dataTables_paginate a").each(function() {
            var $link = $(this);
            $link.attr("role", "button");
        });
        if (params.drawCallback != null) params.drawCallback(settings);
    },

    _currentMenu            : null,
    _currentLink            : null,
    _ignoreNextActionClick  : false,

    _actionsClickListener : function(e){
        console.log("Adding menu item");
        e.preventDefault();
        var $link       = $(e.target);
        if ($link.prop("tagName") != "A") {
            $link       = $link.findParentBy(function($element) { return $element.prop("tagName") == "A"; })
        }

        if (this._currentLink && this._currentLink.is($link)){
            console.log("Current link is the same as the one clicked");
            this._removeMenu();
            return;
        }
        else if (this._currentMenu){
            this._removeMenu();
        }
        this._ignoreNextActionClick = true;

        var $wrapper        = this._getParentWrapper();
        var $menu           = $("#" + $link.attr("data-menu-id"));
        $wrapper.append($menu);
        this._currentMenu   = $menu;
        this._currentLink   = $link;

        // Setup the default styles
        $menu.css({display:"inline-block", position:"absolute"});

        // Now position the element
        var wrapperPos  = $wrapper.offset();
        var linkPos     = $link.offset();
        var actualPos   = {top:linkPos.top - wrapperPos.top + $link.height() + 4, left:linkPos.left - wrapperPos.left};

        // Offset to the left if needs be
        if ($menu.hasClass("actions-menu-right")){
            actualPos.left -= $menu.width();
            actualPos.left += $link.width();
        }

        $menu.css({top:Math.round(actualPos.top) + "px", left:Math.round(actualPos.left) + "px"});
    },

    _actionOutListener : function(e){
        if (this._currentMenu != null){
            if (this._ignoreNextActionClick){
                console.log("Ignoring click");
                this._ignoreNextActionClick = false
            }
            else{
                this._removeMenu();
            }
        }
    },

    _removeMenu : function(){
        console.log("Removing menu");
        this._currentMenu.css("display", "none");
        this._currentMenu = null;
        this._currentLink = null;
    },


    /*
    UTILS
    --------------------------------------------
    */
    _isCurrency : function(data){
        if (!this._currencySymbol) throw new Error("$.fn.ffDataTable.defaults.currency is not set")
        return (data && _.isString(data) && data.indexOf(this._currencySymbol) != -1);
    },

    _addExtraRows: function(minLines, rows, cols)
    {
        rows            = rows.concat();
        var amountToAdd = minLines - rows.length;
        var newRow      = {};
        for (var x = 0; x<cols.length; x++) {
            if (_.isString(cols[x].data)) {
                newRow[cols[x].data]    = this._empty;
                newRow.isEmpty          = true;
            }
        }
        for (var i = 0; i < amountToAdd; i++) {
            rows.push(newRow);
        }
        return rows;
    },

    _showPagination : function(show)
    {
        if (show) {
            this.$el.findParentByClass("dataTables_wrapper").removeClass("hidePagination");
        }
        else {
            this.$el.findParentByClass("dataTables_wrapper").addClass("hidePagination");
        }
    },

    _getParentWrapper : function(){
        return this.$el.findParentByClass("dataTables_wrapper");
    },

    _findFromWrapper : function(selector){
        return this._getParentWrapper().find(selector);
    },

    isCellEmpty : function(cell){
        return cell != null && cell.hasOwnProperty("isEmpty") && cell.isEmpty === true
    }

}, {
    isInitialized:false,
    checkboxPreloader:"checkboxPreloader not setup correctly",
    currencySymbol:null,

});
