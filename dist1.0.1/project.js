/*! By da宗熊 2015-10-13 v1.0.1 https://github.com/linfenpan/projectM.git */
;(function(window){
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

var head = document.head || document.getElementsByTagName("head")[0];
function loadScript(src, callback){
    var script = document.createElement("script");
    script.async = true;

    // 如果支持 onload
    if("onload" in script){
        script.onload = onload;
        script.onerror = function(){
            console.log("加载失败:" + src);
            onload(true);
        }
    }else{
        script.onreadystatechange = function(){
            if(/loaded|complete/.test(script.readyState)){
                onload();
            }
        }
    };

    script.src = src;
    head.appendChild(script);

    function onload(error){
        script.onload = script.onerror = script.onreadystatechange = null;
        head.removeChild(script);
        script = null;

        callback(error, src);
    };

};

// 异步请求封装
var ajax, newAjax;
if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
    newAjax = function(){
        return new XMLHttpRequest()
    };
}else{// code for IE6, IE5
    newAjax = function(){
        return new ActiveXObject("Microsoft.XMLHTTP");
    }
};

// 只发送 get 请求
ajax = function(url, callback){
    var xmlHttp = newAjax();
    xmlHttp.onreadystatechange = function(){
        // 4 = "loaded"
        // 200 = "OK"
        if(xmlHttp.readyState == 4){
            xmlHttp.onreadystatechange = null;
            if(xmlHttp.status == 200 || xmlHttp.status == 302){
                console.log("加载成功");
                callback && callback(false, url, this.responseText, this);
            }else{
                console.log("加载失败..");
                callback && callback(true);
            }
        }
    };
    // 第 3 个参数，代表：是否异步
    xmlHttp.open("GET", url, true);
    // 发送数据
    xmlHttp.send(null);
};

// 路径解析
path = {};
// 路径格式化
path.normal = function(p){
    // 把 ./a/./b//c/d/../e/ ==> ./a//b//c/d/../e/
    p = p.replace(/\/\.\//g, "\/\/");

    // 把 ./a//b/c/d/../e/ ==> ./a/b/c/d/../e/
    p = p.replace(/([^:])\/{2,}/g, "$1\/");

    // 把 ./a/b/c/d/../e/ ==> ./a/b/c/e/
    p = p.replace(/[^/]+\/\.\.\/([^/]*)/g, "$1");

    return p;
};

// 是否绝对路径, ftp:// 或 http:// ，不过 // 这种不知道算不算呢?
path.isAbsolute = function(p){
    return /:\/\//.test(p);
};

// 路径合并
path.join = function(){
    var p = [].join.call(arguments, "\/");
    return this.normal(p);
};

// 目录，http://www.100bt.com 这样的，会有BUG，不过，不理了
path.dir = function(p){
    return p.replace(/(.*\/).*$/, "$1");
};

// 后缀名
path.ext = function(p){
    return p.replace(/.*\.(.*)$/, "$1");
};

// 空函数
function noop(){};
// 类型查询
var typeToString = Object.prototype.toString;
function queryType(o){
    return typeToString.call(o).slice(1, -1).split(" ")[1].toLowerCase();
};
// 是函数?
function isFunction(fn){
    return typeof fn === "function";
};

// 获取函数内的字符串
function queryFnInnerText(fn){
    var str = fn.toString();
    // 为什么 是 /*! */ 这种注释呢? 因为压缩的时候，可以剔除
    return str.slice(str.indexOf("/*!") + 3, str.lastIndexOf("*/")).replace(/^[\n\r]*|[\n\r]*$/g, "");
};

// 遍历
function each(obj, fn){
    for(var i in obj){
        if(obj.hasOwnProperty(i)){
            fn(i, obj[i], obj);
        }
    }
};

// 数据的复制
function extend(){
    var obj = arguments[0] || {}, max = arguments.length - 1, index = 1;
    var item;
    do{
        item = arguments[index] || {};
        for(var i in item){
            if(item.hasOwnProperty(i)){
                obj[i] = item[i];
            }
        }
        index++;
    }while(index < max);
    return obj;
};

// 字符串转 json
function toJSON(str){
    return window.JSON ? JSON.parse(str) : (new Function("return "+ str))();
};

// 简单的模板方法
function Format(data){
    var str = "";
    for(var i in data){
        str += "var " + i + " = \"" + data[i].toString().replace(/(")/g, "\$1") + "\";\n"
    };
    str += 'return str.replace(/\\${([^}]*)}/g, function(str, key){\nreturn eval(key) || "";\n});\n';
    return new Function("str", str);
};

var data = {basePath: null}; // 模板数据, basePath: "/"
var loaded = {};            // 加载完成的脚本
var basePath = "";

// 异步对象
function queryDeferred(url){
    if(loaded[url]){
        return loaded[url].def;
    }else{
        var def = new Callbacks({done: [1, "resolve"], always: 0}, true);
        loaded[url] = def;
        def.exports = null;
        def.done(function(res){
            def.exports = res;
        });
        return def;
    }
};

// 项目设置
if(window.Project){
    extend(data, window.Project.path || {});
    // 修正外部引用
    var other = window.Project.other;
    if(other){
        each(other, function(i, val){
            var def = queryDeferred(i);
            def.resolve(other[i]);
        });
    };
};

// 计算基础路径
;(function(doc){
    var node = null;
    if(data.basePath){
        basePath = data.basePath;
        if(!path.isAbsolute(basePath)){
            node = doc.createElement("a");
            node.setAttribute("href", basePath);
            // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
            basePath = path.dir(node.hasAttribute ? node.href : node.getAttribute("href", 4));
        }
    }else{
        node = doc.getElementById("projectnode") || doc.scripts[0];
        var i = 0;
        while(i++, !node.src){
            node = doc.scripts[i];
        }
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        basePath = path.dir(node.hasAttribute ? node.src : node.getAttribute("src", 4));
    };
    data.basePath = basePath;
})(window.document);

// 加载配置
// p 是路径
// next 是下一步的函数
// ext 是当前路径的后缀
var requireMap = {
    "js": function(p, next, ext){
        loadScript(p, function(error, url){
            if(error !== true){
                next(null, true);
            }
        });
    },
    "default": function(p, next, ext){
        ajax(p, function(error, url, text){
            if(error !== true){
                next(ext == "json" ? toJSON(text) : text);
            }
        });
    }
};

// 仅且加载一个
function requireOne(url, callback){
    url = concatFilePath(url);
    if(url in loaded){
        loaded[url].done(function(exports){
            isFunction(callback) && callback(exports);
        });
        return loaded[url].exports;
    }else{
        // 获取 def 对象
        var def = queryDeferred(url);
        // 开始加载
        var ext = path.ext(url);
        var fn = requireMap[ext] || requireMap["default"];
        fn(url, function(res, isFromScript){
            if(isFromScript){
                res = defineRes;
                defineRes = null;
                if(isFunction(res)){
                    if(res.length == 3){
                        // 预先加载
                        parseBeforeExecute(path.dir(url), res, function(fn){
                            if(isFunction(res)){
                                var module = {exports: {}};
                                res(createiRequire(url), module.exports, module);
                                res = module.exports;
                            }
                            next(res);
                        });
                    }else{
                        // 内置字符串
                        next(queryFnInnerText(res));
                    }
                }else{
                    next(res);
                }
            }else{
                next(res);
            }
        }, ext);
        // 处理完毕
        function next(res){
            def.resolve(res);
            isFunction(callback) && callback(res);
        };
    }
};

// 加载器
var loader = {};

// 文件加载，可加载多个
// require("文件1", "文件2", 回调);
loader.require = function(){
    // require("1.js", "2.js", 回调);
    var args = [].slice.call(arguments, 0), list = args.slice(0, -1), fn = args[args.length - 1];
    if(queryType(fn) === "string"){
        list.push(fn);
        fn = noop;
    };

    var loadCount = 0, res = [], afterFor = false;
    each(list, function(index, url){
        loadCount++;
        requireOne(url, function(data){
            loadCount--;
            res[index] = data;
            // 执行下一步
            next();
        });
    });
    afterFor = true;
    function next(){
        // 用了一次 父级 作用域
        if(afterFor && loadCount <= 0){
            fn.apply(this, res);
        };
    };
    next();
};

// 脚本如果调用了 define
var defineRes = null;
loader.define = function(name, fn){
    var len = arguments.length;
    if(len == 1){
        defineRes = name;
    }else{
        var def = queryDeferred(name);
        def.resolve(fn);
    };
};

// 添加文件 处理器
loader.addProcesser = function(type, fn){
    requireMap[type] = isFunction(fn) ? fn : requireMap[fn];
};

// 文件执行前，对路径进行预解析
function parseBeforeExecute(dir, fn, callback){
    if(isFunction(fn)){
        // 把注视删除
        var str = fn.toString().replace(/\/\*(.|\n|\s)*\*\/|\/\/[^\n\r]*/g, "");
        // 检测的正则
        var reg = /\brequire\s*\(([^)]*)\)/g;
        var res, readyCount = 0, afterCompile = false;
        while(res = reg.exec(str), res){
            // console.log(res[0], res[1]);
            var url = res[1];
            // 如果是 require("data.json")，进行加载
            // 如果是 require("data.json", function(){})，则忽略，等待异步加载
            if(/["']\s*,/.test(url)){
                // 忽略
            }else{
                // 计算器在这里加减，是因为全部是异步的时候，回调的 ready 没有执行的说
                url = url.replace(/"|'/g, "");
                readyCount++;
                require(concatFilePath(url, dir), function(){
                    readyCount--;
                    ready();
                });
            }
        };
        // 计算器为 0，执行回调
        afterCompile = true;
        function ready(){
            if(readyCount <= 0 && afterCompile){
                callback && callback();
            }
        };
        ready();
    }else{
        callback && callback();
    }
};

// define 使用 的 require
// 内置的 require，需要修复一次路径
var cssMap = {};
function createiRequire(url){
    var dir = path.dir(url);
    function iRequire(url, callback){
        // 名字 或 绝对路径
        var absoluteUrl = concatFilePath(url, dir), args = arguments;
        return args.length <= 1 ? requireOne(absoluteUrl, callback) : iRequire.async.apply(this, args);
    };
    // 链接
    iRequire.url = function(url){
        return concatFilePath(url, dir);
    };
    // 异步请求
    iRequire.async = function(){
        // 修正一次路径
        // 然后调用 loader.require
        var args = [].slice.call(arguments, 0), item;
        for(var i = 0, max = args.length; i < max; i++){
            item = args[i];
            typeof item === "string" && (args[i] = concatFilePath(item, dir));
        };
        loader.require.apply(loader, args);
    };
	iRequire.css = function(url){
		url = concatFilePath(url, dir);
		if(!cssMap[url]){
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = url;
			head.appendChild(link);
		};
	};
    return iRequire;
};

// 合并文件路径
// 让 文件 路径，支持模板计算方法
var pathFormat = Format(data);
function concatFilePath(url, dir){
    if(loaded[url]){
        return url;
    };
    // 路径模版化
    url = pathFormat(url);
    if(path.isAbsolute(url)){
        return url;
    }else{
        return path.join(dir || basePath, url);
    }
};

window.require = loader.require;
window.define = loader.define;
window.require.addProcesser = loader.addProcesser;
window.require.ajax = ajax;

})(window);