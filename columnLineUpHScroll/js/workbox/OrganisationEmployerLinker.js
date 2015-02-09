registerClasspath("workbox.OrganisationEmployerLinker", {});

/**
 * Utility for linking organisation & employer select 2 components
 */
workbox.OrganisationEmployerLinker = RootClass.extend({

    _params     : null,
    _dispatcher : null,

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    // Expects $organisation, $employer, organisations, employers, employerURL, organisationId - optional, employerId - optional
    initialize : function(params){
        this._params        = params;
        this._dispatcher    = $({});
        // Check if the elements are inputs or divs. divs means read only
        if (params.$organisation.prop("tagName") == "DIV" || params.$employer.prop("tagName") == "DIV"){
            // Do nothing
        }
        else{
            this.setupSelectTwos();
        }
    },

    bind : function(){
        this._dispatcher.bind.apply(this._dispatcher, arguments);
    },

    getOrganisation : function(){
        return this._params.$organisation.data("selectedFormData");
    },
    getEmployer : function(){
        return this._params.$employer.data("selectedFormData");
    },
    getOrganisationField : function(){
        return this._params.$organisation;
    },
    getEmployerField : function(){
        return this._params.$employer;
    },

    clear : function(){
        this._params.$organisation.select2("data", null);
        this._params.$organisation.data("selectedFormData", null);
        this._params.$employer.select2("data", null);
        this._params.$employer.data("selectedFormData", null);
        this._params.$employer.select2("enable", false);
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    setupSelectTwos : function(){
        // Init
        this._params.$organisation.select2({allowClear:true, data:{results:this._params.organisations, text:this._employerName}, formatSelection:this._employerName, formatResult:this._employerName});

        // Populate selected organisation
        if (this._params.organisationId){
            var orgId           = this._params.organisationId;
            var organisation    = _.find(this._params.organisations, function(item) { return item.id == orgId; });
            this._params.$organisation.select2("data", organisation);
            this._params.$organisation.data("selectedFormData", organisation);
        }

        // Listen
        this._params.$organisation.change($.proxy(this._organisationChangeListener, this));

        // Instantiate employers
        var employers = this._params.employers || [];
        this._params.$employer.select2({allowClear:true, data:{results:employers, text:this._employerName}, formatSelection:this._employerName, formatResult:this._employerName});

        // Populate selected employer
        if (this._params.employerId && employers.length > 0){
            var empId       = this._params.employerId;
            var employer    = _.find(employers, function(item) { return item.id == empId; });
            this._params.$employer.select2("data", employer);
            this._params.$employer.data("selectedFormData", employer);
        }

        // Listen
        this._params.$employer.change($.proxy(this._employerChangeListener, this));

        // Set state
        if (this._params.organisationId == null) this._params.$employer.select2("enable", false);
    },

    _organisationChangeListener : function(e){
        var value = e.added == null ? null : e.added;
        // Store the selectedData for the formUtils
        this._params.$organisation.data("selectedFormData", value);
        this._params.$organisation.trigger("keyup"); // Validation trigger

        // Set enabled based on data
        this._params.$employer.select2("enable", (value != null));
        // Refetch the list
        if (value != null){
            this._params.$employer.select2("enable", false);
            this._params.$employer.parent().find("span.select2-chosen").text(Locale.get("global.loading"));
            $.ajax({
                url : this._params.employerURL.replace("__id__", value.id),
                success : $.proxy(function(json){
                    if (json.data){
                        var employers = json.data;
                        this._params.$employer.select2({allowClear:true, data:{results:employers, text:this._employerName}, formatSelection:this._employerName, formatResult:this._employerName});
                        this._params.$employer.select2("data", null);
                        this._params.$employer.trigger("keyup"); // Validation trigger
                        this._params.$employer.trigger("organisationEmployerLinker_loaded"); // This is added because "select2-loaded" doesn't seem to fire correctly - could be a bug with select2
                        this._params.$employer.select2("enable", true);
                    }
                }, this)
            })
        }
        else{
            this._params.$employer.select2({data:[]});
        }
        this._dispatcher.trigger("organisationEmployerLinker_organisationChange", this.getOrganisation());
    },

    _employerChangeListener : function(e){
        // Store the selectedData for the formUtils
        this._params.$employer.data("selectedFormData", (e.added == null) ? null : e.added);
        this._params.$employer.trigger("keyup"); // Validation trigger
        this._dispatcher.trigger("organisationEmployerLinker_employerChange", this.getEmployer());
    },

    _employerName : function(employer){
        return (employer && employer.organisation) ? employer.organisation.name : null;
    }

});