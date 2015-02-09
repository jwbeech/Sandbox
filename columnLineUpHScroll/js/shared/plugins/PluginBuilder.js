registerClasspath("shared.plugins.PluginBuilder", {});

/**
 * This is a utility to generate extensions to the jQuery plugin framework.
 * It supports auto initialisation with delegated body.on events.
 * Also supports static implementations with body.on events.
 */
shared.plugins.PluginBuilder = {

    _pluginStore : {},

    /**
     * Creates a jQuery plugin using a specific name, all methods on that plugin are accessed by using $("selector").pluginName().publicMethod();
     *
     * This method returns the attached jQuery plugin, so its not need but suggested you execute this method like this for intellij click through support:
     * $.fn.pluginName = shared.plugins.PluginBuilder.generatePlugin(xyz);
     *
     * @param pluginName {String} The name to use for the jQuery plugin
     * @param mixins {Object} An object to be used for the instance methods of the plugin
     * @param defaults {Object} Optional: An object to be typed onto the jQuery object using the same pluginName
     * @param bodyOnEvent {String} Optional. A list of events to add to the body. When these are triggered it will instantiate the plugin
     * @param bodyOnSelector {String} Optional. A selector to use to target the body on listeners. Note this will also be used as the main DOM element to retrieve this component.
     * @param mixinListenerMethod {String} Optional. The listener to call after instantiation for the body on events
     */
    generatePlugin : function(pluginName, mixins, defaults, bodyOnEvent, bodyOnSelector, mixinListenerMethod){
        var store       = {defaults:defaults, bodyOnEvent:bodyOnEvent, bodyOnSelector:bodyOnSelector};
        var dataName    = pluginName + "_neverUseDirectly";

        // Setup a base class that gets extended
        var BaseDef = RootClass.extend({
            pluginName  : pluginName,
            dataName    : dataName,
            $el         : null,
            $find       : function(){
                return this.$el.find.apply(this.$el, arguments);
            },
            destroy     : function(){
                // Unregister
                this.$el.data(dataName, "");
            }
        });

        // Store and override the original initialize
        var originalInit    = mixins.initialize;
        mixins.initialize   = function() {};
        // Create the class definition
        var ClassDef        = BaseDef.extend(mixins);

        // Define the main plugin instantiation and retrieval
        $.fn[pluginName] = function(){
            var retInst            = this.data(dataName);
            if (!retInst) {
                // Create, populate, store, initialize
                retInst            = new ClassDef();
                retInst.$el        = this;
                retInst.initialize = originalInit;
                this.data(dataName, retInst);
                if (retInst.initialize != null){
                    retInst.initialize.apply(retInst, arguments);
                }
            }
            return retInst;
        };

        // Store the defaults if populated
        if (defaults){
            $.fn[pluginName].defaults = defaults;
        }

        // Add listeners when the dom is ready
        if (bodyOnEvent != null && bodyOnSelector != null){
            $(function(){
                // This listener instantiates the component
                store.bodyOnListener = function(e){
                    // Create and retrieve
                    var inst = $(bodyOnSelector)[pluginName]();

                    // Call any listener defined
                    if (mixinListenerMethod){
                        inst[mixinListenerMethod].apply(inst, [e]);
                    }
                };
                $("body").on(bodyOnEvent, bodyOnSelector, store.bodyOnListener)
            });
        }

        this._pluginStore[pluginName] = store;

        return $.fn[pluginName];
    },

    unRegisterPlugin : function(pluginName){
        // Pull the reference and remove the body listener and remove the reference
        var reference = this._pluginStore[pluginName];
        if (reference.bodyOnEvent && reference.bodyOnSelector && reference.bodyOnListener){
            $("body").off(reference.bodyOnEvent, reference.bodyOnSelector, reference.bodyOnListener);
        }
        delete this._pluginStore[pluginName];
    }
}