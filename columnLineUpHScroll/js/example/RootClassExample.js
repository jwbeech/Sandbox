registerClasspath("example.RootClassExample", {});

/**
 * An example implementation of a JavaScript class.
 * Please see the end of the class for notes on class usage
 *
 * Conventions:
 *  - Private properties and methods are prefixed with _
 */
example.RootClassExample = RootClass.extend(
{
    /*
    VERY IMPORTANT NOTE:
    About class param initialisation
    --------------------------------
    Instance properties must always be set to null and initialised in the constructor.
    If a property is set on declaration that same object will be shared across all
    instances of the class will inevitably cause confusion and bugs.
    */

    // PUBLIC PROPERTIES
    publicPropertyExample   : null,

    // PRIVATE PROPERTIES
    _constructorParam1      : null,
    _constructorParam2      : null,
    _className              : null,

    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    /**
     * The initialize method acts as the class constructor
     * @param param1 String Example of a constructor param
     * @param param2 Boolean Example of a constructor param
     */
    initialize : function(param1, param2)
    {
        console.log("RootClassExample.initialize");
        this._constructorParam1     = param1;
        this._constructorParam2     = param2;
        this._className             = "RootClassExample";
        this._privateExampleMethod();
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    /**
     * Notice the _ marking this method as private
     * Unfortunately this doesn't prevent you from using this method on an instance of the class
     * but get caught doing so and face the wrath of angry Cape Tonians...
     * @private
     */
    _privateExampleMethod : function()
    {
        console.log("_privateExampleMethod()");
        console.log("this._className: " + this._className);
        console.log("this.publicPropertyExample: " + this.publicPropertyExample);
    }
},
{
    // STATIC CONSTANTS
    THIS_IS_A_STATIC_CONSTANT : "thisIsAStaticConstant",

    /*----------------------------------------------+
    | STATIC METHODS								|
    +----------------------------------------------*/
    /**
     * Static properties and methods are defined in the second argument for RootClass.extend()
     */
    staticMethod : function()
    {
        console.log("This is a static method");
    }
});


/**
 * This shows how to implement class inheritance
 */
example.RootClassExampleExtension = example.RootClassExample.extend(
{
    /*---------------------------------------------+
    | PUBLIC METHODS					           |
    +---------------------------------------------*/
    // Overrides the constructor
    initialize : function()
    {
        console.log("RootClassExampleExtension.initialize");
        this._className             = "RootClassExampleExtension";
        this._privateExampleMethod();
    },

    _privateExampleMethod : function()
    {
        this.publicPropertyExample = "now set to something";
        this.callSuper(example.RootClassExample, "_privateExampleMethod");
    }
},
{
    /*----------------------------------------------+
    | STATIC METHODS								|
    +----------------------------------------------*/
    staticMethod : function()
    {
        this.callSuper(example.RootClassExample, "staticMethod");
    }
});

var myRootClassExampleInstance                      = new example.RootClassExample("something", "something else");
console.log("----------------------------------------------------------------------------------------");
var myRootClassExampleExtensionInstance = new example.RootClassExampleExtension();
console.log("----------------------------------------------------------------------------------------");
console.log("example.RootClassExample.THIS_IS_A_STATIC_CONSTANT: " + example.RootClassExample.THIS_IS_A_STATIC_CONSTANT);
