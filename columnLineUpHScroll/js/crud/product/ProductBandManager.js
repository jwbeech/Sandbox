registerClasspath("crud.product.ProductBandManager", {});

crud.product.ProductBandManager = RootClass.extend({

    // PRIVATE PROPERTIES
    _data           : null,

    _classUID       : null,
    _debug          : false,
    _cnt            : null,
    _currBandId     : null,
    _currDataType   : null,
    _currBaseRate   : null,
    _$dataTable     : null,

    PERCENT         : "percent",
    CURRENCY        : "currency",
    NUMBER          : "number",

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    initialize : function(data){
        this._data  = data;
        this._cnt   = 1;

        // Manipulate all the cells in the matrix so each cell has a fee map for fast access
        _.each(this._data.productBandWrapper.product.productMatrix, function(row){
            _.each(row, function(cell){
                cell.feeMap = {};
                _.each(cell.feeDeltas, function(fee){
                    cell.feeMap[fee.productFeeId] = fee;
                });
            });
        });

        // Setup classes + listeners
        this._classUID = (new Date()).getTime();
        data.$parent.on("click", ".splitColumn_"    + this._classUID, $.proxy(this._splitColumnListener, this));
        data.$parent.on("click", ".editColumn_"     + this._classUID, $.proxy(this._editColumnListener, this));
        data.$parent.on("click", ".deleteColumn_"   + this._classUID, $.proxy(this._deleteColumnListener, this));
        data.$parent.on("click", ".splitRow_"       + this._classUID, $.proxy(this._splitRowListener, this));
        data.$parent.on("click", ".editRow_"        + this._classUID, $.proxy(this._editRowListener, this));
        data.$parent.on("click", ".deleteRow_"      + this._classUID, $.proxy(this._deleteRowListener, this));

        $("body")
            .on("click", ".cancelBtn_" + this._classUID, $.proxy(this._cancelListener, this))
            .on("click", ".saveBtn_" + this._classUID, $.proxy(this._submitListener, this))
            .on("submit", "#editForm_" + this._classUID, $.proxy(this._submitListener, this))
            .on("keyup", "#delta_" + this._classUID, $.proxy(this._deltaChangeListener, this))
            .on("click", $.proxy(this._bodyListener, this));
    },

    populateForId : function(productFeeId){
        this._currBandId    = productFeeId;
        var matrix          = this._data.productBandWrapper.product.productMatrix;

        if (productFeeId == "interest"){
            this._currDataType  = this.PERCENT;
            this._currBaseRate  = this._data.productBandWrapper.product.baseInterestRate;
        }
        else{
            this._currDataType      = this._resolveType(this._data.productBandWrapper.product.productMatrix[0][0].feeMap[productFeeId].type.name);

            if (this._currDataType == this.PERCENT){
                this._currBaseRate  = this._data.productBandWrapper.feeMapPercent[productFeeId];
            }
            else if (this._currDataType == this.CURRENCY){
                this._currBaseRate  = this._data.productBandWrapper.feeMapCurrency[productFeeId];
            }
            else if (this._currDataType == this.NUMBER){
                this._currBaseRate  = this._data.productBandWrapper.feeMapNumber[productFeeId];
            }
        }

        console.log("Building new table");
        var rows    = [];

        // Build the header html & inject it - this only happens once
        if (this._$dataTable == null){
            var html    = [];
            html.push("<thead><tr><th>&nbsp;</th>");
            _.each(matrix[0], function(cell, cellIndex){
                var content = this._getHeaderCell(cell, cellIndex, (cellIndex + 1 == matrix[0].length), (matrix[0].length == 1));
                html.push(content);
            }, this);
            html.push("</tr></thead>");
            this._data.$table.html(html.join("\r"));
        }

        // Build the cell data
        _.each(matrix, function(row, rowIndex){
            // Add the term column
            var rowData = { columnTerm:{cell:row[0], rowIndex:rowIndex, isLast:(rowIndex + 1 == matrix.length)} };
            rows.push(rowData);

            _.each(row, function(cell, columnIndex){
                rowData["column_" + columnIndex] = this._getCell(cell, productFeeId, rowIndex, columnIndex);
            }, this);

        }, this);

        if (this._$dataTable == null){
            // Build the columns
            var cols    = [];
            cols.push({data:"columnTerm", className:"termCell", render: $.proxy(this._columnTermRender, this, (rows.length == 1))});
            _.each(matrix[0], function(cell, cellIndex){ cols.push({data:"column_" + cellIndex}); });

            this._$dataTable = this._data.$table.ffDataTable();
            var sScrollX = (cols.length > 5) ? (100 + (cols.length - 5) * 20) + "%": "100%";
            this._$dataTable.createTable({cols:cols, rows:rows, sort:false, hscroll:true, pagination:false, sScrollX:sScrollX});
        }
        else{
            this._$dataTable.repopulateData(rows);
        }

        // Add all the cell listeners
        $("a.matrixCell_" + this._classUID)
            .popover({
                placement   : "top",
                title       : Locale.get("product.editValue"),
                trigger     : "",
                html        : true,
                container   : "body",
                content     : $.proxy(this._buildCellEditor, this)
            })
            .click($.proxy(this._cellListener, this))
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/

    /*
    UTILS
    --------------------------------------------
    */
    _columnTermRender : function(isOnlyRow, row, type, set, meta){
        var cell        = row.cell;
        var content     = "";
        // For debugging
        if (this._debug){
            content += '<span class="cellText pull-left">' + cell.termStart + ' - ' + cell.termEnd + ' ' + '</span>';
        }
        else{
            content += '<span class="cellText pull-left">' + Locale.get("product.upTo") + ' ' + cell.termEnd + ' ' + Locale.get("global.months") + '</span>';
        }
        content     += '<div class="btn-group pull-right">';
        var btn     = '<button type="button" class="btn btn-default btn-sm {0}" data-row-index="{1}" title="{2}"><span class="glyphicon {3}"></span></button>';
        if (!row.isLast){
            content     += _.replaceTokens(btn, ["editRow_" + this._classUID, row.rowIndex, Locale.get("product.editRow"), "glyphicon-pencil"]);
        }
        // Make sure there is space within this column to actually add another
        if (cell.termEnd - cell.termStart >= 2) {
            content     += _.replaceTokens(btn, ["splitRow_" + this._classUID, row.rowIndex, Locale.get("product.splitRow"), "glyphicon-resize-horizontal"]);
        }
        if (!isOnlyRow){
            content     += _.replaceTokens(btn, ["deleteRow_" + this._classUID, row.rowIndex, Locale.get("product.removeRow"), "glyphicon-remove"]);
        }
        content     += '</div>';
        return content;
    },

    _getHeaderCell : function(cell, colIndex, isLast, isOnlyCol){
        var content = "";
        // For debugging
        if (this._debug){
            content     += '<span class="headerText pull-left">' + shared.UnitConverter.centsToCurrency(cell.minimumPrincipalAmount) + ' - ';
            content     += shared.UnitConverter.centsToCurrency(cell.maximumPrincipalAmount);
        }
        else{
            content     += '<span class="headerText pull-left">' + Locale.get("product.upTo") + ' ';
            content     += shared.UnitConverter.centsToCurrency(cell.maximumPrincipalAmount);
        }
        content     += '</span>';
        content     += '<div class="pull-right btn-group">';
        var btn     = '<button type="button" class="btn btn-default btn-sm {0}" data-column-index="{1}" title="{2}"><span class="glyphicon {3}"></span></button>';
        if (!isLast){
            content     += _.replaceTokens(btn, ["editColumn_" + this._classUID, colIndex, Locale.get("product.editColumn"), "glyphicon-pencil"]);
        }
        // Make sure there is space within this column to actually add another
        if (cell.maximumPrincipalAmount - cell.minimumPrincipalAmount >= 2){
            content     += _.replaceTokens(btn, ["splitColumn_" + this._classUID, colIndex, Locale.get("product.splitColumn"), "glyphicon-resize-horizontal"]);
        }
        if (!isOnlyCol){
            content     += _.replaceTokens(btn, ["deleteColumn_" + this._classUID, colIndex, Locale.get("product.removeColumn"), "glyphicon-remove"]);
        }
        content     += '</div>';
        return '<th>' + content +"</th>";
    },

    _getCell : function(cell, productFeeId, rowIndex, columnIndex){
        var delta, base, calculated, prefix, content, dataType, lowerThanZero;
        if (productFeeId == "interest"){
            delta       = cell.interestRateDelta;
            base        = this._data.productBandWrapper.product.baseInterestRate;
            dataType    = this.PERCENT;
        }
        else{
            dataType    = this._resolveType(cell.feeMap[productFeeId].type.name);

            if (dataType == this.PERCENT){
                delta       = cell.feeMap[productFeeId].percentDelta;
                base        = this._data.productBandWrapper.feeMapPercent[productFeeId];
            }
            else if (dataType == this.CURRENCY){
                delta       = cell.feeMap[productFeeId].amountDelta;
                base        = this._data.productBandWrapper.feeMapCurrency[productFeeId];
            }
            else if (dataType == this.NUMBER){
                delta       = cell.feeMap[productFeeId].amountDelta;
                base        = this._data.productBandWrapper.feeMapNumber[productFeeId];
            }
        }
        if (isNaN(base) || base == null) throw new Error("Cell base is NaN");
        if (isNaN(delta) || delta == null){
            delta       = 0
        }

        prefix          = (Number(delta) > 0 ? "+ " : "");
        calculated      = new Big(base).plus(delta);
        if (Number(calculated) < 0){
            lowerThanZero   = true;
            calculated      = 0;
        }
        if (dataType == this.PERCENT){
            content     = prefix + _.multiplyBy100(delta) + " % (" + _.multiplyBy100(calculated) + " %)";
        }
        else if (dataType == this.CURRENCY){
            content     = prefix + shared.UnitConverter.centsToCurrency(delta) + " (" + shared.UnitConverter.centsToCurrency(calculated) + ")";
        }
        else if (dataType == this.NUMBER){
            content     = prefix + delta + " (" + calculated + ")";
        }
        return _.replaceTokens('<td><span class="cellText"><a class="btn-table btn matrixCellLink {0} {1}" data-delta="{2}" data-effective="{3}" role="button" data-row-index="{4}" data-column-index="{5}">{6}</a></span></td>', [
            (lowerThanZero ? 'matrixCellInvalid' : ''),
            "matrixCell_" + this._classUID,
            delta,
            calculated,
            rowIndex,
            columnIndex,
            content
        ]);
    },

    /*
    LISTENERS
    --------------------------------------------
    */
    _splitColumnListener : function(e){
        console.log("Splitting a column");
        var columnIndex = $(e.currentTarget).attr("data-column-index");
        var url         = this._data.frm.updateURLForModule(this._data.splitColumnURL, this._data.moduleId);
        url             = shared.URLBuilder.addDataToURL(url, {moduleParam_columnIndex:columnIndex});
        shared.PopupManager.loadAndShowPopup(url);
    },
    _editColumnListener : function(e){
        console.log("Editing a column");
        var columnIndex = $(e.currentTarget).attr("data-column-index");
        var url         = this._data.frm.updateURLForModule(this._data.editColumnURL, this._data.moduleId);
        url             = shared.URLBuilder.addDataToURL(url, {moduleParam_columnIndex:columnIndex});
        shared.PopupManager.loadAndShowPopup(url);
    },
    _deleteColumnListener : function(e){
        var columnIndex = $(e.currentTarget).attr("data-column-index");
        shared.PopupManager.showConfirmation("Are you sure you want to delete this column?", $.proxy(function(button){
            if (button == shared.PopupManager.BUTTON_YES){
                console.log("Deleting column");
                this._data.frm.runDirectCall(this._data.moduleId, this._data.deleteColumnURL, {columnIndex:columnIndex, bandId:this._currBandId});
            }
        }, this));
    },

    _splitRowListener : function(e){
        console.log("Spliting a term row");
        var rowIndex    = $(e.currentTarget).attr("data-row-index");
        var url         = this._data.frm.updateURLForModule(this._data.splitRowURL, this._data.moduleId);
        url             = shared.URLBuilder.addDataToURL(url, {moduleParam_rowIndex:rowIndex});
        shared.PopupManager.loadAndShowPopup(url);
    },
    _editRowListener : function(e){
        console.log("Editing a term row");
        var rowIndex    = $(e.currentTarget).attr("data-row-index");
        var url         = this._data.frm.updateURLForModule(this._data.editRowURL, this._data.moduleId);
        url             = shared.URLBuilder.addDataToURL(url, {moduleParam_rowIndex:rowIndex});
        shared.PopupManager.loadAndShowPopup(url);
    },
    _deleteRowListener : function(e){
        var rowIndex = $(e.currentTarget).attr("data-row-index");
        shared.PopupManager.showConfirmation("Are you sure you want to delete this row?", $.proxy(function(button){
            if (button == shared.PopupManager.BUTTON_YES){
                console.log("Deleting row");
                this._data.frm.runDirectCall(this._data.moduleId, this._data.deleteRowURL, {rowIndex:rowIndex, bandId:this._currBandId});
            }
        }, this));
    },


    /*
    CELL EDITING
    --------------------------------------------
    */
    _$currLink      : null,
    _$cellEditor    : null,
    _$currEffective : null,
    _ignoreNext     : false,

    _cellListener : function(e){
        e.preventDefault();
        if (this._$currLink && this._$currLink.is(e.currentTarget)) {
            this._hideCellPopup();
            return;
        }
        if (this._$currLink != null) {
            this._$currLink.one("hidden.bs.popover", $.proxy(this._addPopup, this, $(e.currentTarget)));
            this._hideCellPopup();
        }
        else{
            this._ignoreNext = true;
            this._addPopup($(e.currentTarget));
        }
    },
    _bodyListener : function(e){
        if (this._$cellEditor != null && this._ignoreNext == false){
            var contains = $.contains(this._$cellEditor[0], e.target);
            if (!contains) this._hideCellPopup();
        }
        this._ignoreNext = false;
    },
    _cancelListener : function(e){
        e.preventDefault();
        this._hideCellPopup();
    },
    _submitListener : function(e){
        e.preventDefault();
        var $delta      = $("#delta_" + this._classUID);
        var delta       = this._getForDataType(this._currDataType, $delta);
        var rowIndex    = this._$currLink.attr("data-row-index");
        var columnIndex = this._$currLink.attr("data-column-index");
        this._data.frm.runDirectCall(this._data.moduleId, this._data.saveCellURL, {delta:delta, bandId:this._currBandId, rowIndex:rowIndex, columnIndex:columnIndex});
        this._hideCellPopup();
    },
    _deltaChangeListener : function(e){
        if (this._$cellEditor){
            var delta       = this._getForDataType(this._currDataType, $(e.currentTarget));
            var effective   = 0;
            try{
                effective   = Number(new Big(this._currBaseRate).plus(delta).toString());
            }
            catch (e) {}
            effective       = Math.max(0, effective);
            if (!this._$currEffective) this._$currEffective = this._$cellEditor.find("#effective_" + this._classUID);
            this._setForDataType(this._currDataType, this._$currEffective, effective);
        }
    },


    // Utils
    _addPopup : function($link){
        this._$currLink     = $link;
        this._$currLink.popover("show");
        this._$currLink.one("shown.bs.popover", $.proxy(function(e){
            var content         = $("#cellEditor_" + this._classUID);
            this._$cellEditor   = content.length > 0 ? content.parent().parent() : null;
        }, this));
    },
    _buildCellEditor : function(){
        var effective = this._$currLink.attr("data-effective");
        return _.template(this._data.cellEditorTemplate, {
            uid             : this._classUID,
            formatterType   : this._currDataType,
            effectiveValue  : effective,
            delta           : this._$currLink.attr("data-delta")
        });
    },
    _hideCellPopup : function(){
        if (this._$currLink) this._$currLink.popover("hide");
        this._$currLink         = null;
        this._$cellEditor       = null;
        this._$currEffective    = null;
    },

    _resolveType : function(feeValueType){
        if (this._data.productBandWrapper.percentTypeNameMap[feeValueType] == true){
            return this.PERCENT;
        }
        else if (this._data.productBandWrapper.currencyTypeNameMap[feeValueType] == true){
            return this.CURRENCY;
        }
        else if (this._data.productBandWrapper.numberTypeNameMap[feeValueType] == true){
            return this.NUMBER;
        }
    },

    _getForDataType : function(dataType, $element){
        if (dataType == this.PERCENT){
            return $element.ffPercentInput("getPercentValue");
        }
        else if (dataType == this.CURRENCY){
            return $element.ffCurrencyInput("getCentsValue");
        }
        else if (dataType == this.NUMBER){
            return $element.ffNumberInput("getNumberValue");
        }
    },

    _setForDataType : function(dataType, $element, value){
        if (dataType == this.PERCENT){
            $element.ffPercentInput("setPercentValue", value);
        }
        else if (dataType == this.CURRENCY){
            $element.ffCurrencyInput("setCentsValue", value);
        }
        else if (dataType == this.NUMBER){
            $element.ffNumberInput("setNumberValue", value);
        }
    }
});