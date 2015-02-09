$.fn.checklist = shared.plugins.PluginBuilder.generatePlugin("checklist", {

    initialize : function (grailsState, doumentURLs, reasons) {
        this.$find(".checklistRow").each(function(index, item){
            $(item).checklistLine(grailsState, doumentURLs[index], reasons, index);
        });
    },

    destroy : function(){
        this.$el.data(this.dataName, "");
        this.$find(".checklistRow").each(function(index, item){
            $(item).destroy();
        });
    }
});

$.fn.checklistLine = shared.plugins.PluginBuilder.generatePlugin("checklistLine", {
    // PUBLIC PROPERTIES
    BROWSE          : ".browse",
    UPLOAD_WAITING  : ".uploadWaiting",
    UPLOADING       : ".uploading",
    DROP_HERE       : ".dropHere",
    REUPLOAD_VIEW   : ".reuploadView",
    VIEW_ONLY       : ".viewOnly",
    APPROVE         : ".approve",

    // PRIVATE PROPERTIES
    _currentState   : null,
    _uploadFileName : null,
    _initialState   : null,
    _documentURL    : null,
    _reasons        : null,
    _approveURL     : null,

    _$uploadForm    : null,
    _$compFile      : null,
    _$dummyFile     : null,
    _$progressBar   : null,
    _$spinner       : null,
    _droppedFiles   : null,

    _$docInput      : null,
    _$approveInput  : null,

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    initialize : function (initialState, doumentURL, reasons, index) {
        this._initialState  = initialState;
        this._documentURL   = doumentURL;
        this._reasons       = reasons;
        this._applyInitialState();

        // Cache
        this._$progressBar  = this.$find(".progressInner");
        this._approveURL    = this.$find(".approveWraper").attr("data-approve-url");
        this._$spinner      = this.$find(".approve img");

        // Populate the document field
        this._$docInput     = this.$find("input[name='document_" + index + "']");
        this._$approveInput = this.$find("input[name='approvalInput_" + index + "']");
        this._setFormValue(true, false, doumentURL);

        var rejected        = this.$find("input.rejectRadio").prop("checked");
        var approved        = this.$find("input.approveRadio").prop("checked");
        var value           = (!rejected && !approved) ? "" : approved;
        this._setFormValue(false, false, value);

        // Add dummy uploader
        var id              = "uploadForm_" + new Date().getTime();
        this.$el.append('<form  id="' + id + '" class="hidden"><input type="file" name="resource" class="one"/><input type="file" name="resource" class="two"/></form>');
        this._$uploadForm   = $("#" + id);
        this._$compFile     = this._$uploadForm.find(".one");
        this._$dummyFile    = this._$uploadForm.find(".two");
        var url             = this.$find(".uploadWaiting button").attr("data-upload-url");
        var file            = this._$compFile.fileupload({autoUpload:false, url:url});

        // Add listeners
        file.bind("fileuploadprogress", $.proxy(this._progressListener, this));
        this.$find("input[type=radio]").on("change", $.proxy(this._approveChange, this));
        this.$find(".browse button").on("click", $.proxy(this._browseListener, this));
        this._$dummyFile.on("change", $.proxy(this._fileSelectListener, this));
        this.$find(".uploadWaiting a").on("click", $.proxy(this._clearListener, this));
        this.$find(".reuploadLink").on("click", $.proxy(this._browseListener, this));
        this.$find(".uploadWaiting button").on("click", $.proxy(this._uploadListener, this));
        this.$find(".approve select").on("change", $.proxy(this._reasonChangeListener, this));

        this.$el.on("drop", $.proxy(this._dragDropListener, this));
        this.$el.on("dragenter", $.proxy(this._dragEnterListener, this));
        this.$el.on("dragover", $.proxy(this._dragEnterListener, this));
        //this.$el.on("dragleave", $.proxy(this._dragLeaveListener, this));
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/

    /*
    UTILS
    --------------------------------------------
    */
    _applyInitialState : function(){
        switch (this._initialState){
            case "Default":     this._setState(this._documentURL ? this.REUPLOAD_VIEW : this.BROWSE); break;
            case "ViewOnly":    this._setState(this.VIEW_ONLY); break;
            case "Approval":
            case "ApprovalReupload":
                this._setState(this.APPROVE);
                break;
        }
    },

    _setState : function (state) {
        // Remove old state
        if (this._currentState){
            this.$find(this._currentState).setVisible(false);
        }
        // Set new state
        this._currentState = state;
        if (this._currentState){
            // Show hide view btn based on document url
            this.$find(".viewBtn").setVisible(this._documentURL != null);
            this.$find(".divider").setVisible(this._documentURL != null);

            // Setup before showing
            switch (this._currentState){
                case this.UPLOAD_WAITING:
                    this.$find(".uploadBtn").html(Locale.get("Checklist.upload") + " " + _.concatenate(this._uploadFileName, 15));
                    break;
                case this.UPLOADING:
                    this._$progressBar.css("width", 0);
                    break;
            }
            var canSetState = (!(this._currentState == this.APPROVE && this._documentURL == null));
            this.$find(this._currentState).setVisible(canSetState);
        }
    },

    _applyApprovalChange : function(approved, reason){
        this._setFormValue(false, false, approved);
        // Save the change
        this._$spinner.css("visibility", "visible");
        var data        = {approved:approved};
        if (reason) data.reasonCode = reason;
        $.ajax({
            url         : this._approveURL,
            type        : "POST",
            data        : {data:JSON.stringify(data)},
            complete    : $.proxy(function(){
                this._$spinner.css("visibility", "hidden");
            }, this)
        });
    },

    _setFormValue : function(isDocument, isWaiting, value){
        if (isDocument){
            // Populate the document field
            this._$docInput.val(isWaiting ? "_documentwaiting_" : value);
            if (!isWaiting && (this._initialState == "ViewOnly" || this._initialState == "Approval")){
                this._$docInput.val("somethingValid");
            }
        }
        else{
            // Remove the hidden field value as its not yet populated
            this._$approveInput.val(isWaiting ? "_noreasonset_" : value);
            if (!isWaiting && (this._initialState == "ViewOnly" || this._initialState == "Default")){
                this._$approveInput.val("somethingValid");
            }
        }
        this.$find(".formholder label").remove();
    },


    /*
    LISTENERS
    --------------------------------------------
    */
    _approveChange : function(){
        var rejected    = this.$find("input.rejectRadio").prop("checked");
        var $approve    = this.$find(".approve");
        $approve.removeClass("showReason");
        if (rejected){
            this._setFormValue(false, true, "");
            $approve.addClass("showReason");
        }
        else{
            // Remove the reason selection
            this.$find(".approve select").prop("selectedIndex", 0);
            this._applyApprovalChange(!rejected);
        }
    },

    _reasonChangeListener : function(e){
        var value   = this.$find(".approve select").val();
        var reason  = _.find(this._reasons, function(item) { return item.id == value; });
        if (reason) this._applyApprovalChange(false, reason);
    },

    _browseListener : function(e){
        e.preventDefault();
        this._$dummyFile.trigger("click");
    },

    _fileSelectListener : function(e){
        this._uploadFileName = this._$dummyFile.val();
        this._setFormValue(true, (this._uploadFileName != null), "");
        if (this._uploadFileName && this._uploadFileName != "") this._setState(this.UPLOAD_WAITING);
    },

    _clearListener : function(e){
        e.preventDefault();
        this._droppedFiles = null;
        this._$uploadForm.get(0).reset();
        this._setFormValue(true, false, "");
        this._applyInitialState();
    },

    _uploadListener : function(e){
        e.preventDefault();
        this._setState(this.UPLOADING);

        var files = (this._droppedFiles) ? this._droppedFiles : this._$dummyFile.prop("files");
        var jqXHR = this._$compFile.fileupload("send", {autoUpload:false, files:files});
        jqXHR.success($.proxy(this._successListener, this));
        jqXHR.error($.proxy(this._errorListener, this));
    },

    _successListener : function(result, textStatus, jqXHR){
        if (result.passed){
            this._documentURL = result.documentURL;
            this._setFormValue(true, false, this._documentURL);
            this.$find(".viewBtn").attr("href", this._documentURL);
        }
        this._applyInitialState();
    },

    _errorListener : function(jqXHR, textStatus, errorThrown){
        var str = "textStatus: " + textStatus + "<br/>errorThrown: " + errorThrown;
        shared.PopupManager.showError(Locale.get("Checklist.uploadError"), str);
        this._applyInitialState();
    },

    _progressListener : function(e, data){
        var progress = Math.round(data.loaded / data.total * 100);
        this._$progressBar.css("width", progress + "%");
    },

    _dragEnterListener : function(e){
        if (this._currentState == this.BROWSE){
            e.preventDefault();
            e.stopImmediatePropagation();
            //console.log("enter");
            //if (this._currentState != this.DROP_HERE) this._setState(this.DROP_HERE);
            return false;
        }
    },
    _dragLeaveListener : function(e){
        if (this.$el[0] == e.target){
            //console.log("leave");
            this._applyInitialState();
        }
    },
    _dragDropListener : function(e){
        if (this._currentState == this.BROWSE) {
            e.preventDefault();
            this._droppedFiles = e.originalEvent.dataTransfer.files;
            this._uploadFileName = (this._droppedFiles && this._droppedFiles.length > 0) ? this._droppedFiles[0].name : null;
            this._setFormValue(true, (this._uploadFileName != null), "");
            if (this._uploadFileName) this._setState(this.UPLOAD_WAITING);
        }
    }
});