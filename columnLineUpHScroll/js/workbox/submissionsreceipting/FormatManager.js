registerClasspath("workbox.submissionsreceipting.FormatManager", {});

workbox.submissionsreceipting.FormatManager = RootClass.extend(
    {
        // PRIVATE PROPERTIES
        type                    : null,
        _tableHolderSelector    : null,
        _tableSelector		    : null,
        _dropDownSelector	    : null,
        _ignoreNext			    : false,
        _showing			    : false,

        _ignoreLabel		    : null,
        _ignoreQuestionLabel    : null,
        _lineNumberLabel        : null,

        _responseIDtoNameHash   : null,
        _responseNameToIDHash   : null,

        _$check 			    : null,
        _$input 			    : null,
        _$select                : null,
        _$sysCol 			    : null,
        _$title 			    : null,


        /*---------------------------------------------+
        | PUBLIC METHODS					           |
        +---------------------------------------------*/

        initialize : function(params){
            this.type                   = params.type;
            this._tableHolderSelector   = params.tableHolderSelector;
            this._ignoreLabel           = params.ignoreLabel;
            this._ignoreQuestionLabel   = params.ignoreQuestionLabel;
            this._lineNumberLabel       = params.lineNumberLabel;
        },

        writeTableHeader : function(tableSelector, cols, formatColumns, responseComboData, rawData)
        {
            this._tableSelector	= tableSelector;
            var newCols		    = [];
            var head		    = "<thead>\r<tr>\r";
            var row             = (rawData && rawData.length > 0) ? _.clone(rawData[0]) : null;
            if (this._isReceipting()) {
                this._createResponseHashes(responseComboData);

                formatColumns = _.sortBy(formatColumns, "position");

                newCols = [
                    {data:"lineNumber"}
                ];

                head		+= '<th><span class="headerTxt">'+this._ignoreQuestionLabel+'</span></th>';
                head		+= '<th><span class="headerTxt">'+this._lineNumberLabel+'</span></th>';

                var namesHash = {};
                _.each(responseComboData, function(item){
                    namesHash[item.enumName] = item.name;
                });
                _.each(formatColumns, function(item){
                    var newCol  = {data:"col_"+item.position};
                    // Only add the col if there is associated data
                    if (row == null || row[newCol.data] != null){
                        var title	= (item.ignored) ? this._ignoreLabel : Locale.get(namesHash[item.field.name]);
                        head		+= '<th><span class="headerTxt">' + title + '</span>\r';
                        head		+= '<a href="#" class="headerLink"><span class="caret"></span></a></th>';
                        newCols.push(newCol);
                        delete row[newCol.data];
                    }
                }, this);

                // Add any remaining col_<x> properties
                for (var propName in row){
                    if (propName.indexOf("col_") != -1){
                        head		+= '<th><span class="headerTxt">' + this._ignoreLabel + '</span>\r';
                        head		+= '<a href="#" class="headerLink"><span class="caret"></span></a></th>';
                        newCols.push({data:propName});
                    }
                }
                cols			= newCols;
            }
            else {
                if (formatColumns){

                    formatColumns = _.sortBy(formatColumns, "position");

                    // Convert the cols to a hash
                    var colHash		= {};
                    _.each(cols, function(item){ colHash[item.batchFieldEnumName] = item; }, this);


                    _.each(formatColumns, function(item){
                        var related	= colHash[item.field.name];
                        var title	= (item.headerKey && item.headerKey != "") ? item.headerKey : related.originalTitle;
                        if (item.ignored){
                            title	= this._ignoreLabel;
                        }
                        head		+= '<th data-column-enum-name="' + related.batchFieldEnumName + '"><span class="headerTxt" data-system-text="' + related.originalTitle + '">' + title + '</span>\r';
                        head		+= '<a href="#" class="headerLink"><span class="caret"></span></a></th>';
                        newCols.push(related);
                    }, this);
                    cols			= newCols;
                }
                else{
                    _.each(cols, function(item){
                        head	+= '<th data-column-enum-name="' + item.batchFieldEnumName + '"><span class="headerTxt" data-system-text="' + item.originalTitle + '">' + item.originalTitle + '</span>\r';
                        head	+= '<a href="#" class="headerLink"><span class="caret"></span></a></th>';
                    }, this);
                }
            }

            head			+= "</tr>\r</thead>";

            $(tableSelector).html(head);

            return cols;
        },

        addListeners : function(tableSelector, dropDownSelector){
            this._dropDownSelector	= dropDownSelector;
            var $body = $("body");

            // Move the drop down and add its listeners
            var $drop = $(this._dropDownSelector);
            $body.append($drop);

            // Find reuseale elements
            this._$sysCol	= $(this._dropDownSelector + " div.readOnlyLabel");
            this._$check	= $(this._dropDownSelector + " input[type='checkbox']");
            if (this._isReceipting()) {
                this._$select   = $(this._dropDownSelector + " select");
                this._$select.change($.proxy(this._selectListener, this));
            }
            else {
                this._$input	= $(this._dropDownSelector + " input[type='text']");
                this._$input.keypress($.proxy(this._keyListener, this));
            }
            this._$check.change($.proxy(this._ignoreChangeListener, this));


            // Add listeners

            this._bodyListener          = $.proxy(this._bodyListener, this);
            this._htmlRenderListener    = $.proxy(this._htmlRenderListener, this);
            $body.on("click", this._bodyListener);
            $body.bind("htmlAdded", this._htmlRenderListener);

            // Execute to add the listener
            this._htmlRenderListener({target:$(this._tableHolderSelector)[0]});
        },

        addHeaderLinkListener:function(tableSelector)
        {
            $(tableSelector + " .headerLink").click($.proxy(this._headerListener, this));
        },

        getFilterColumns : function(){
            var results		= [];
            var $root;
            var $headers;
            if (this._isReceipting()) {
                $root		= $(this._tableSelector).findParentBy(function(item) { return item.hasClass("dataTable"); });
                $headers	= $root.find("thead th");

                $headers.each($.proxy(function(i, value){
                    if (i != 0 && i != 1) {
                        var $th			    = $(value);
                        var $titleHolder    = $th.find(".headerTxt");
                        var field;
                        var headerText	    = $titleHolder.html();
                        var ignored		    = (headerText == this._ignoreLabel);
                        var headerKey       = (!ignored) ? headerText : "";
                        if (this._responseNameToIDHash[$titleHolder.html()] != null) {
                            field			= this._responseNameToIDHash[$titleHolder.html()];
                        }
                        results.push({position:i-2, field:field, ignored:ignored, headerKey:headerKey});
                    }
                }, this));
            }
            else {
                $root		= $(this._tableSelector).findParentBy(function(item) { return item.hasClass("dataTables_scroll"); });
                $headers	= $root.find(".dataTables_scrollHead th");

                $headers.each($.proxy(function(i, value){
                    var $th			= $(value);
                    var id			= $th.attr("data-column-enum-name");
                    var titleHolder	= $th.find(".headerTxt");
                    var headerText	= titleHolder.html();
                    var ignored		= (headerText == this._ignoreLabel);
                    var newText;
                    if (!ignored && headerText != titleHolder.attr("data-system-text")){
                        newText		= headerText
                    }

                    // ID needs to be changed to the related enum value for
                    results.push({position:i, field:{enumName:id}, ignored:ignored, headerKey:newText});
                }, this));
            }

            return results;
        },

        dataTableBuildComplete : function(){
            $(this._tableHolderSelector + " .dataTables_scrollBody").on("scroll", function(){ console.log("scroll working"); });
        },

        destroy : function(){
            $("body").off("click", this._bodyListener);
            $("body").unbind("htmlAdded", this._htmlRenderListener);
        },

        /*----------------------------------------------+
        | PRIVATE METHODS								|
        +----------------------------------------------*/
        _headerListener : function(e){
            e.preventDefault();

            if (this._showing) this._commit();

            this._ignoreNext	= true;
            this._showing		= true;

            var $drop		= $(this._dropDownSelector);

            var $th			= $(e.target).findParentBy(function(item) { return item.prop("tagName") == "TH"; });
            var $a			= $th.find("a");
            this._$title	= $th.find(".headerTxt");
            var pos			= $th.offset();
            var aPos		= $a.offset();

            // Setup the drop down
            this._$check.prop("checked", false);

            if (this._isReceipting()) {
                this._$select.prop("disabled", false);
                this._$select[0].selectedIndex = 0;

                if (this._$title.html() == this._ignoreLabel){
                    this._$select.prop("disabled", true);
                    this._$check.prop("checked", true);
                }
                else {
                    this._$select.val(this._responseNameToIDHash[this._$title.html()].id);
                }
            }
            else {
                this._$input.attr("disabled", false);
                this._$input.val("");

                if (this._$title.html() == this._ignoreLabel){
                    this._$input.attr("disabled", true);
                    this._$check.prop("checked", true);
                }
                else if (this._$title.html() != this._$title.attr("data-system-text")){
                    this._$input.val(this._$title.html());
                }
                this._$sysCol.html(this._$title.attr("data-system-text"));
            }

            $drop.css("top", Math.round(pos.top + 25));
            $drop.css("left", Math.round(aPos.left - $(this._dropDownSelector).width()));
            $drop.css("display", "block");
        },

        _bodyListener : function(e){
            console.log("body");
            if (this._showing){
                if (this._ignoreNext){
                    this._ignoreNext = false;
                }
                else{
                    var $drop = $(this._dropDownSelector);
                    if (!$.contains($drop.get(0), e.target)){
                        this._hide();
                    }
                }
            }
        },

        _htmlRenderListener : function(e){
            //$(e.target).find(".dataTables_scrollBody").on("scroll", $.proxy(this._scrollListener, this));
            //$(e.target).find(".dataTables_scrollBody").on("scroll", function(){ console.log("scroll working"); });
            //$(".dataTables_scrollBody").on("scroll", function(){ console.log("scroll working"); } );
        },

        _scrollListener : function(e){
            console.log("scroll");
            if (this._showing){
                this._hide();
            }
        },

        _hide : function(){
            this._showing = false;
            $(this._dropDownSelector).css("display", "none");
            this._commit();
        },

        _ignoreChangeListener : function(e){
            if (this._isReceipting()) {
                if ($(e.target).prop("checked")){
                    this._$select[0].selectedIndex = 0;
                    this._$select.prop("disabled", true);
                }
                else{
                    this._$select.prop("disabled", false);
                }
            }
            else{
                if ($(e.target).prop("checked")){
                    this._$input.val("").attr("disabled", true);
                }
                else{
                    this._$input.attr("disabled", false);
                }
            }
        },

        _keyListener : function(e){
            if(e.which == 13) this._hide();
        },

        _selectListener : function(e)
        {
            this._hide();
        },

        _commit : function(){
            if (this._isReceipting()) {
                if (this._$check.prop("checked")){
                    this._$title.html(this._ignoreLabel);
                }
                else if (this._$select[0].selectedIndex == 0){
                    this._$check.prop("checked", true);
                    this._$title.html(this._ignoreLabel);
                }
                else{
                    this._$title.html(this._responseIDtoNameHash[this._$select.val()]);
                }
            }
            else {
                if (this._$check.prop("checked")){
                    this._$title.html(this._ignoreLabel);
                }
                else if (this._$input.val() != ""){
                    this._$title.html(this._$input.val());
                }
                else{
                    this._$title.html(this._$title.attr("data-system-text"));
                }
            }
            $(this._tableSelector).ffDataTable().recalculateColumns();
        },

        /*
        UTILS
        --------------
        */
        _createResponseHashes : function (responseComboData)
        {
            var idToNameHash = {};
            var nameToIDHash = {};
            _.each(responseComboData, function(item){
                idToNameHash[item.id] = item.name;
                nameToIDHash[item.name] = {id:item.id, enumName:item.enumName};
            });
            this._responseIDtoNameHash = idToNameHash;
            this._responseNameToIDHash = nameToIDHash;
        },

        _isReceipting : function() {
            return (this.type == workbox.submissionsreceipting.FormatManager.RECEIPTING);
        }
    },
    {
        SUBMISSIONS : "submissions",
        RECEIPTING : "receipting"
    });