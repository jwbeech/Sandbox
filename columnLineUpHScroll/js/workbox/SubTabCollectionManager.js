registerClasspath("workbox.SubTabCollectionManager", {});


/**
 * This class is designed to manage the loading of tab content for sub tab navs
 */
workbox.SubTabCollectionManager = RootClass.extend({

    // PRIVATE PROPERTIES
    _loadedTabs			: null,
    _tabRegister		: null,
    _selectorPrefix		: null,

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    /**
     * Initialize function adds code to load the tabs as they are changed to
     * @param tabRegister An array of: arrays of $.proxy methods to register and load the module content
     * @param selectorPrefix The jquery selector prefix to make selections unique to the tabs
     */
    initialize : function(tabRegister, selectorPrefix){
        this._loadedTabs		= {};
        this._tabRegister		= tabRegister;
        this._selectorPrefix	= selectorPrefix;

        // Set the first tab as loaded
        this._loadedTabs[$(selectorPrefix + " .subTabNav li[class='active'] a").attr("href")] = true;

        // Handle the tab changing
        $(selectorPrefix + " .subTabNav a").click($.proxy(this._tabChangeListener, this));
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    /**
     * Listener to manage the loading of content within a tab. This is called when a tab is clicked.
     * @private
     */
    _tabChangeListener : function(e){
        if (e) {
            e.preventDefault();
            // Call the tab nav show method
            $(e.target).tab("show");
        }
        var prefix			= this._selectorPrefix;
        var uid				= $(prefix + " .subTabNav li[class='active'] a").attr("href");

        // Load the tab if not already loaded boet
        if (!this._loadedTabs[uid]){
            this._loadedTabs[uid]   = true;

            // Execute the callback
            this._tabRegister[uid]();
        }
    }
});