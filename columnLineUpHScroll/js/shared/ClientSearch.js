registerClasspath("shared.ClientSearch", {});

shared.ClientSearch = {

    // EVENTS
    DATA_LOADED         : "dataLoaded",

    _params             : null,

    _formSelector       : null,
    _dataTable          : null,

    _$newBtn            : null,
    _$searchBtn         : null,
    _$resultsHolder     : null,

    _$personalFields    : null,
    _$employmentFields  : null,
    _$accountFields     : null,

	setupSearch : function(params) {
        this._params                = params;
		this._$searchBtn		    = $(this._params.parentSelector + " .searchBtn");
		this._$newBtn			    = $(this._params.parentSelector + " .newClientBtn");
		this._$resultsHolder	    = $(this._params.parentSelector + " .resultsHolder");
		this._formSelector	        = this._params.parentSelector + " .searchForm";
        this._$personalFields       = this._params.fieldHolders.$personalFields;
        this._$employmentFields     = this._params.fieldHolders.$employmentFields;
        this._$accountFields        = this._params.fieldHolders.$accountFields;

        this._$employmentFields.hide();
        this._$accountFields.hide();

        this._$resultsHolder.setVisible(false);

        // Handle Type of search change
        this._params.formFields.$findClientBy.on("change", $.proxy(this._handleTypeOfSearchChange, this));

        // Handle Prev search
        this._params.formFields.$prevSearch.click($.proxy(this._handlePrevSearch, this));

        // Repopulate search form based on prev search criteria selection
        shared.EventFacade.bind(Events.CLIENT_RECENT_SEARCH_SELECT, $.proxy(this._handleRecentClientSearchSelect, this));

        shared.FormUtils.listenToSubmit($.proxy(this._params.clientSearchFormSelector, this), this._params.searchBtnSelector, $.proxy(this._handleSubmitForm, this));

        // Handle Form Clear
        $(this._params.parentSelector + " .clearBtn").click($.proxy(this._clearForm, this));
	},

    _handleSubmitForm : function(e)
    {
        e.preventDefault();

        var data            = shared.FormUtils.serialiseForm(this._formSelector);
        data.organisationId = (data.organisationId != null) ? data.organisationId.id : null;
        data.employerId     = (data.employerId != null) ? data.employerId.id : null;

        console.log("this._params.formSubmitURL: ", this._params.formSubmitURL)

        $.ajax({
            url		: this._params.formSubmitURL,
            data	: data,
            type	: "GET",
            success	: $.proxy(function(json, textStatus, jqXHR) {
                if (json.passed) {
                    this._hideLoading(true);
                    this._params.dataTable = this._params.dataTable.destroyAndRecreate(this._params.$resultsTableWrapper, this._params.resultsTableHTML, this._params.resultsTableId);
                    this._params.dataTable.createTable({
                        cols            : this._params.columns,
                        rows            : json.data,
                        minLines        : this._params.minLines,
                        maxLines        : this._params.maxLines,
                        sort            : true,
                        aaSorting       : [[1, 'asc']],
                        pagination      : true,
                        rightTargets    : this._params.rightTargets
                    });
                    this._params.$resultsTableWrapper.trigger(shared.ClientSearch.DATA_LOADED, [json.data]);
                }
                else {
                    this._hideLoading(false);
                }
            }, this)
        });

        // Show Loading
        shared.FormUtils.toggleAllComps($(this._params.parentSelector), true);
        this._$searchBtn.button("loading");
    },


    _handleTypeOfSearchChange : function(e)
    {
        var value = Number($(e.target).val());
        this._$personalFields.hide();
        this._$employmentFields.hide();
        this._$accountFields.hide();
        switch (value) {
            case this._params.options.personal:
                this._$personalFields.show();
                break;
            case this._params.options.employment:
                this._$employmentFields.show();
                break;
            case this._params.options.account:
                this._$accountFields.show();
                break;
        }
    },

    _handlePrevSearch : function(e)
    {
        e.preventDefault();
        shared.PopupManager.loadAndShowPopup(this._params.prevSearchURL);
    },

    _handleRecentClientSearchSelect : function(e, data)
    {
        console.log("Recent search selected: ", data);
        this._clearForm();
        this._params.formFields.$findClientBy.val(data.searchCategoryOrdinal).trigger("change");
        this._params.formFields.$firstName.val(data.firstName);
        this._params.formFields.$clientId.val(data.clientId);
        this._params.formFields.$lastName.val(data.lastName);
        this._params.formFields.$bankId.val(data.bankId);
        this._params.formFields.$idNumber.val(data.idNumber);
        this._params.formFields.$bankAccountNumber.val(data.bankAccountNumber);
        this._params.formFields.$passportNumber.val(data.passportNumber);
        this._params.formFields.$employer.one("organisationEmployerLinker_loaded", $.proxy(function(e){
            this._params.formFields.$employer.select2("val", data.employerId);
            // Unfortunately this won't work as it's not part of the same thread that runs the original button click so is blocked by the browser
            //findClientByObj.formFields.$searchBtn.trigger("click");
        }, this));
        this._params.formFields.$organisation.select2("val", data.organisationId, true);
        this._params.formFields.$employeeNumber.val(data.employeeNumber);
        this._params.formFields.$agreementId.val(data.agreementId);
    },


    /*
    Utils
    --------------------------------------------
    */
    _hideLoading : function (hasResults){
        shared.FormUtils.toggleAllComps($(this._params.parentSelector), false);
        this._$searchBtn.button("reset");
        this._$newBtn.setVisible(hasResults);
        this._$resultsHolder.setVisible(hasResults);
    },

    _clearForm : function(e){
        shared.FormUtils.clearForm(this._$personalFields);
        shared.FormUtils.clearForm(this._$employmentFields);
        shared.FormUtils.clearForm(this._$accountFields);
        this._params.employerLinker.clear();
        this._$newBtn.setVisible(false);
        this._$resultsHolder.setVisible(false);
    }
};