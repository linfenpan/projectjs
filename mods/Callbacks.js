// 带有信号的 回调
/*
    var cb = new Callbacks({}, false);
    cb.add(function(){
        console.log("有执行 fire:1 的时候");
    }, 1);
    cb.fire(1, 参数1， 参数2);

    cb.add(fn); // 则无论遇到什么信号，都会执行
*/
function Callbacks(params, isMemory){
    var item, key;
    // 打包字符串
    function packupString(str){
        return queryType(str) == "string" ? "\"" + str + "\"" : str;
    };
    for(var i in params){
        if(params.hasOwnProperty(i)){
            item = key = params[i];
            if(queryType(item) == "array"){
                key = item[0];
                if(item = item[1], item){
                    this[item] = new Function("this.fire.apply(this, ["+ packupString(key) +"].concat([].slice.call(arguments, 0)))");
                }
            }

            this[i] = new Function("fn", "this.add(fn, "+ packupString(key) +");return this;");
        }
    };
    // 记忆模式？
    this.isMemory = isMemory || false;
    this._sign_ = -1;
    this._args_ = [];

    this._fnList_ = [];
};
Callbacks.prototype = {
    // 信号
    // 参数列表
    fire: function(sign){
        var list = this._fnList_, args = [].slice.call(arguments, 1), item;
        this._args_ = args;
        this._sign_ = sign;

        for(var i = 0, max = list.length; i < max; i++){
            item = list[i];
            // 不用恒等于了，因为 undefined 比较难拼
            if(sign == item["sign"] || !item["sign"]){
                item.fn.apply(this, args);
            }
        };
    },
    // 回调
    // 信号
    add: function(fn, sign){
        this._fnList_.push({fn: fn, sign: sign});
        if(this.isMemory && (sign == this._sign_ || !sign)){
            fn.apply(this, this._args_);
        }
    }
};
