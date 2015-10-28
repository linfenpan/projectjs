"use strict";

// 基于信号的回调
function Signal(){
    this.list = [];
    this.after = [];
};
Signal.prototype = {
    add: function(cb){
        if(typeof cb === "function"){
            this.list.push(cb);
        }
        return this;
    },
    // 启动检测
    start: function(){
        var list = this.list.slice(0);

        var next = function(){
            let fn = list.shift();
            if(fn){
                fn.apply(this, args);
            }else{
                // 把 next 干掉!
                this.executeCallback.apply(this, args.slice(0, args.length - 1));
            }
        }.bind(this);
        var args = [].slice.call(arguments, 0).concat([next]);
        next();

        return this;
    },
    callback: function(cb){
        if(typeof cb === "function"){
            this.after.push(cb);
        };
        return this;
    },
    clearCallback: function(){
        this.after = [];
        return this;
    },
    executeCallback: function(){
        // 执行所有 callback 操作
        var args = arguments;
        this.after.forEach(function(fn){
            fn.apply(this, args);
        }.bind(this));
    }
};

module.exports = Signal;
