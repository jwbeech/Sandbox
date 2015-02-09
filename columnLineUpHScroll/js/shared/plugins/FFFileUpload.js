$.fn.ffFileUpload = shared.plugins.PluginBuilder.generatePlugin("ffFileUpload", {

    // EVENTS:
    // ---------------------------
    // ffFileUpload_uploadStart
    // ffFileUpload_uploadComplete
    // ffFileUpload_progress

    _$form          : null,
    _$browseFile    : null,
    _$uploadFile    : null,
    _$buttonGroup   : null,

    /*---------------------------------------------+
    | CONSTRUCTOR                 		           |
    +---------------------------------------------*/
    /**
     * @param params.url The url to upload the file to
     */
    initialize : function(params)
    {
        if (params.url == null) {
            throw new Error("The upload URL is a required parameter");
        }
        var id              = "ffFileUpload_" + _.uniqueId();
        var formId          = id + "form";
        var browseId        = id + "browse";
        var fileId          = id + "file";
        var formHTML        = '<form id="'+formId+'" class="hidden"><input id="'+browseId+'" type="file" name="resource"/><input id="'+fileId+'" type="file" name="resource" /></form>';
        this.$el.parent().append(formHTML);

        this._$form         = $("#" + formId);
        this._$browseFile   = $("#" + browseId);
        this._$uploadFile   = $("#" + fileId);

        this._$label        = this.$el.find(".ffFileInput_label");

        this._$browseBtn    = this.$el.find(".ffFileInput_browseBtn");
        this._$uploadBtn    = this.$el.find(".ffFileInput_uploadBtn");
        this._$uploadBtn    = this._$uploadBtn.detach();
        this._$buttonGroup  = this._$browseBtn.parent();

        this._$browseBtn.click($.proxy(function(e){
            e.preventDefault();
            this._$browseFile.trigger("click");
        }, this));
        this._$label.click($.proxy(function(e){
            e.preventDefault();
            this._$label.blur();
            this._$browseFile.trigger("click");
        }, this));

        this._$browseFile.on("change", $.proxy(function(){
            this._$label.val(this._$browseFile.val());
            this._showHideUpload(true);
        }, this));

        var file = this._$uploadFile.fileupload({autoUpload:false, url:params.url});
        file.bind("fileuploadprogress", $.proxy(this._handleUploadProgress, this));

        this._$uploadBtn.click($.proxy(this._handleUpload, this));
    },


    /*---------------------------------------------+
    | PUBLIC METHODS           		               |
    +---------------------------------------------*/
    disable : function()
    {
        shared.FormUtils.toggleAllComps(this.$el, true);
    },

    enable : function()
    {
        shared.FormUtils.toggleAllComps(this.$el, false);
    },

    /*---------------------------------------------+
    | PRIVATE METHODS           		           |
    +---------------------------------------------*/
    _handleUpload : function(e){
        e.preventDefault();

        var files = this._$browseFile.prop("files");
        this.disable();
        this.$el.trigger("ffFileUpload_uploadStart");

        this._$uploadFile.fileupload("send", {
            autoUpload  : false,
            files       : files,
            success     : $.proxy(this._handleSuccess, this),
            error       : $.proxy(this._handleError, this)
        });
    },

    _handleSuccess : function (result, textStatus, jqXHR) {
        this.enable();
        if (result.passed == true) {
            this._showHideUpload(false);
            this._$label.val("");
            this.$el.trigger("ffFileUpload_uploadComplete", result.data);
        }
    },

    _handleError : function (jqXHR, textStatus, errorThrown) {
        console.log("jqXHR: " + jqXHR);
        console.log("textStatus: " + textStatus);
        console.log("errorThrown: " + errorThrown);
    },

    _handleUploadProgress : function(e, data)
    {
        var progress = Math.round(data.loaded / data.total * 100);
        console.log("progress: ", progress);
        this.$el.trigger("ffFileUpload_progress", progress);
    },

    _showHideUpload : function(show)
    {
        this._$buttonGroup  = this._$browseBtn.parent();
        if (show) {
            this._$buttonGroup.append(this._$uploadBtn);
        }
        else {
            this._$uploadBtn = this._$uploadBtn.detach();
        }
    }
});