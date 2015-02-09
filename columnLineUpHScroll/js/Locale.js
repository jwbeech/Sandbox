registerClasspath("Locale", {});

Locale = {
	_store				: [],
	_collectionStore	: [],

	/**
	 * Returns a i18n string by identifier
	 * @param id The i18n identifier
	 */
	get : function(id){
		return (this._store.hasOwnProperty(id)) ? this._store[id] : id;
	},
	/**
	 * Stores a i18n string by identifier
	 * @param id The i18n identifier
	 * @param text The string to store
	 */
	store : function(id, text){
		this._store[id] = text;
	},

	/**
	 * Stores a collection of i18n strings
	 * @param collection An object with properties as identifiers and values as names. {"person.firstname":"First Name"}
	 * @param name The name to use to retrieve the collection again
	 */
	storeCollection : function(collection, name){
		this._collectionStore[name] = collection
	},

	/**
	 * Returns a locale collection alr5eady stored
	 * @param name The name of the collection
	 */
	getCollection : function(name){
		return this._collectionStore[name]
	}
};