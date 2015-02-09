registerClasspath("workbox.JobBagManager", {});

/**
 * Class for managing the JobBag
 */
workbox.JobBagManager = RootClass.extend({

    processName         : null,
    modulesToUpdate     : null,

    jobBagWindow        : null,
    _$jobBagLaunchBtn   : null,
    _setupDone          : false,

    /*----------------------------------------------+
    | PUBLIC METHODS								|
    +----------------------------------------------*/
    init_baseApp : function($jobBagLaunchBtn, processInstanceId, jobBagURL)
    {
        $(document).ajaxSend($.proxy(this._handleAjaxSend, this));

        this._$jobBagLaunchBtn  = $jobBagLaunchBtn;
        var newJobBagUrl        = jobBagURL.replace("index", "");
        this._$jobBagLaunchBtn.click($.proxy(function(e){
            e.preventDefault();
            if (this.jobBagWindow == null || this.jobBagWindow.closed) {
                var $window         = $(window);
                var padding	        = 50;
                var winWidth        = $window.width();
                var winHeight       = $window.height();
                var width	        = 1205;
                var height	        = winHeight - (padding*2);
                var left	        = (winWidth/2)-(width/2);
                window.open(newJobBagUrl + "/" + processInstanceId, "", "menubar=no,location=no,toolbar=no,resizable=yes,scrollbars=yes,status=yes,top="+padding+",left="+left+",height="+height+",width="+width+"").focus();
            }
            else {
                this.jobBagWindow.focus();
            }
        }, this));
    },

    init_jobBagPopup : function()
    {
        this.modulesToUpdate    = [];
        var pieces              = document.URL.split("/");
        this.processName        = pieces[pieces.length-2];
        window.opener.jobBagManager.processName = this.processName;
        this._maintainConnectionWithParent();
        $(window).focus($.proxy(this._handleWindowFocus, this));
    },


    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    /*
    MAIN APP
    --------------------------------------------
    */
    _handleAjaxSend : function(event, jqXHR, ajaxOptions)
    {
        if (this.jobBagWindow != null && ajaxOptions.type == "POST") {
            var urlParams       = _.getURLParameters(ajaxOptions.url);
            if (urlParams.hasOwnProperty("moduleId")) {
                var frm         = workbox.ModuleRequestFramework.retrieveInstance(urlParams.tabCollectionId, urlParams.tabId);
                var moduleName  = frm.getModuleName(urlParams.moduleId);
                console.log("Storing module " + moduleName);
                this.jobBagWindow.jobBagManager.modulesToUpdate.push(moduleName);
            }
        }
    },


    /*
    JOB BAG
    --------------------------------------------
    */
    _maintainConnectionWithParent : function()
    {
        if (window.opener){
            if (!this._setupDone) {
                this._setupDone = true;
                window.opener.jobBagManager.jobBagWindow = window;
            }
            else if (!window.opener.jobBagManager || window.opener.jobBagManager.processName != this.processName) {
                window.close();
            }
            setTimeout($.proxy(this._maintainConnectionWithParent, this), 500);
        }
        else {
            window.close();
        }
    },

    _handleWindowFocus : function(event)
    {
        console.log("_handleWindowFocus");
        if (this.modulesToUpdate.length > 0) {
            console.log("There are modules that need to update: " + this.modulesToUpdate.join(", "));
            var frms = workbox.ModuleRequestFramework.retrieveAllInstances();

            for (var tabCollectionId in frms) {
                var currTabCollection   = frms[tabCollectionId];
                for (var tabId in currTabCollection) {
                    var frm             = currTabCollection[tabId];
                    frm.invalidateModules(this.modulesToUpdate.concat());
                }
            }
            this.modulesToUpdate = [];
        }
    }
});