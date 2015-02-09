// Setup the template defaults
_.templateSettings.evaluate     = /\{\[([\s\S]+?)\]\}/g;
_.templateSettings.interpolate	= /\{\{([\s\S]+?)\}\}/g;


/*
SETUP
--------------------------------------------
*/
// Setup component information
window.baseURL                              = "flexifin-web";
var region                                  = "en-ZA";
$.fn.ffDateInput("setupDefaults", 120);
$.fn.ffCurrencyInput("setRegion", region);
$.fn.ffCurrencyInput("setRegion", region);

var symbol                                  = $.formatCurrency.regions[region].symbol;
shared.PopupManager.homeURL                 = "/";
var spinner                                 = '<div class="modalSpinnerHolder animated fadeIn animation1s"><div class="modalSpinner"><img src="images/spinner_50.gif" width="50" height="50"/></div></div>';
$.fn.modal.defaults.spinner                 = spinner;
$.fn.modalmanager.defaults.spinner          = spinner;
$.fn.ffDataTable.defaults.currencySymbol    = symbol;
$.fn.ffDataTable.defaults.checkboxPreloader = '<img src="images/spinner_13.gif" width="13" height="13"/>';
$.fn.ffDataTable.defaults.mainPreloader     = '<img src="images/spinner_24.gif" width="24" height="24"/>';

shared.RuntimeURLManager.clientSearchURL    = "/clientSearch";

// Force all ajax calls to be uncached
$.ajaxSetup({cache:false});