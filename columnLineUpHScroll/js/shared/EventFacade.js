registerClasspath("shared.EventFacade", {});

/**
 * Central system for dispatching and listening to events in an uncoupled way
 * Helps for uncoupled systems to communicate, designed with modules in mind
 */
shared.EventFacade = {

    _dispatcher : null,

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    init : function(){
        this._dispatcher = $(this);
    },

    /**
     * Binds a jQuery event onto a central dispatcher, if tabCollectionId or tabId are passed they used to generate an event suffix
     * @param eventName {String} The name of the event to listen to
     * @param listener {Function} The function to call as a listener
     * @param tabCollectionId {String} Optional. The tabCollectionId string used as a part for the namespace
     * @param tabId {String} Optional. The tabId string used as a part for the namespace
     */
    bind : function(eventName, listener, tabCollectionId, tabId){
        eventName = this._getEventName(eventName, tabCollectionId, tabId);
        //console.log("------------> Binding event for: ", eventName);
        this._dispatcher.on(eventName, listener);
    },

    /**
     * Triggers a jQuery event on a central dispatcher, if tabCollectionId or tabId are passed they used to generate an event suffix
     * @param eventName {String} The name of the event to listen to
     * @param data {Object} Any object to be passed to the listener
     * @param tabCollectionId {String} Optional. The tabCollectionId string used as a part for the namespace
     * @param tabId {String} Optional. The tabId string used as a part for the namespace
     */
    trigger : function(eventName, data, tabCollectionId, tabId){
        eventName = this._getEventName(eventName, tabCollectionId, tabId);
        //console.log("------------> triggering event for: ", eventName);
        this._dispatcher.trigger(eventName, data);
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _getEventName : function(eventName, tabCollectionId, tabId){
        var result = eventName;
        if (tabCollectionId != null || tabId != null){
            if (tabId == null || tabId == ""){
                throw new Error("tabId cannot be null if tabCollectionId is passed");
            }
            else if (tabCollectionId == null || tabCollectionId == ""){
                throw new Error("tabCollectionId cannot be null if tabId is passed");
            }
            else{
                result = eventName + "." + tabCollectionId + "." + tabId;
            }
        }
        return result;
    }
};
shared.EventFacade.init();