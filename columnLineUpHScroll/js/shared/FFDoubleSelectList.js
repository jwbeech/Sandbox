registerClasspath("shared.FFDoubleSelectList", {});
shared.FFDoubleSelectList = RootClass.extend({

    // PRIVATE PROPERTIES
    _$leftList      : null,
    _$rightList     : null,
    _$rightBtn      : null,
    _$rightAllBtn   : null,
    _$leftBtn       : null,
    _$leftAllBtn    : null,
    _objectHash     : null,
    _labelField     : null,
    _idField        : null,

    /*----------------------------------------------+
    | PUBLIC METHODS								|
    +----------------------------------------------*/
    initialize : function($leftList, $rightList, $rightBtn, $rightAllBtn, $leftBtn, $leftAllBtn, leftObjects, rightObjects, labelField, idField){
        // ^^ buttons are named in the direction they send content
        // Store
        this._$leftList     = $leftList;
        this._$rightList    = $rightList;
        this._$rightBtn     = $rightBtn;
        this._$rightAllBtn  = $rightAllBtn;
        this._$leftBtn      = $leftBtn;
        this._$leftAllBtn   = $leftAllBtn;
        this._labelField    = labelField;
        this._idField       = idField;

        // Convert
        this._objectHash    = {};
        function addItem($list, item){
            var id                  = _.getOnObject(item, idField);
            var label               = _.getOnObject(item, labelField);
            this._objectHash[id]    = item;
            $list.append('<option value="' + id + '">' + label + '</option>');
        }
        _.each(leftObjects, $.proxy(addItem, this, $leftList));
        _.each(rightObjects, $.proxy(addItem, this, $rightList));

        // Add listeners
        $rightBtn.on("click", $.proxy(this._rightListener, this));
        $rightAllBtn.on("click", $.proxy(this._rightAllListener, this));
        $leftBtn.on("click", $.proxy(this._leftListener, this));
        $leftAllBtn.on("click", $.proxy(this._leftAllListener, this));
    },

    /**
     * Returns the objects that are selected
     */
    getRightItems : function(){
        var retList = [];
        this._$rightList.find("option").each($.proxy(function(index, item){
            var id = $(item).val();
            retList.push(this._objectHash[id]);
        }, this));
        return retList;
    },

    /**
     * Returns the objects that are selected
     */
    getLeftItems : function(){
        var retList = [];
        this._$leftList.find("option").each($.proxy(function(index, item){
            var id = $(item).val();
            retList.push(this._objectHash[id]);
        }, this));
        return retList;
    },

    /*----------------------------------------------+
    | PRIVATE METHODS								|
    +----------------------------------------------*/
    _rightListener : function(e){
        this._$leftList.find(":selected").each($.proxy(function(index, item){
            this._$rightList.append(item);
        }, this));
    },
    _rightAllListener : function(e){
        this._$leftList.find("option").each($.proxy(function(index, item){
            this._$rightList.append(item);
        }, this));
    },
    _leftListener : function(e){
        this._$rightList.find(":selected").each($.proxy(function(index, item){
            this._$leftList.append(item);
        }, this));
    },
    _leftAllListener : function(e){
        this._$rightList.find("option").each($.proxy(function(index, item){
            this._$leftList.append(item);
        }, this));
    }
});