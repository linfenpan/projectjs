/*! By da宗熊 2016-01-26 v1.0.6 https://github.com/linfenpan/projectM.git */
;(function(window){
var head = document.head || document.getElementsByTagName("head")[0];
var loadedScriptCBMap = { /** 已经加载的 url，回调函数 map */ };
function loadScript(src, callback){
    if (loadedScriptCBMap[src]) {
        loadedScriptCBMap[src].push(callback);
        return;
    }

    // 没加载过
    loadedScriptCBMap[src] = [callback];

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

        each(loadedScriptCBMap[src], function(index, callback){
            callback(error, src);
        });
        loadedScriptCBMap[src] = "loaded";
    };

};

// 获取当前加载的脚本 URL
var interactiveScript;
function getCurrentScript(){
    // IE6 - 9 的浏览器，script.onload 之后，脚本可能还没执行完成
    // 判断当前 interactive[未执行完毕] 状态的节点，可知道当前运行的脚本
    if (interactiveScript && interactiveScript.readyState === "interactive") {
        return interactiveScript.getAttribute("src");
    }
    var scripts = head.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
        var script = scripts[i]
        if (script.readyState === "interactive") {
            interactiveScript = script
            return interactiveScript.getAttribute("src");
        }
    }
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
var path = {};
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

// 异步对象
function queryDeferred(url){
    if(loaded[url]){
        return loaded[url];
    }else{
        var def = {
            loaded: 0,      // 是否加载完成，-1 代表 define 定义的，0 未加载，1加载完成
            exports: null,   // 对外提供的数据
            rs: resetDef    // 设置 def 的数据
        };
        loaded[url] = def;
        return def;
    }
};
// queryDeferred 的 def 对象，使用到的方法
function resetDef(loaded, exports){
    this.loaded = loaded;
    if(loaded){
        this.exports = exports;
    }
};

// 配置
function config(pro){
    pro = pro || {};
    data = pro.path || data;

    // 修正外部引用
    each(pro.other || {}, function(i, val){
        var def = queryDeferred(i);
        def.rs(1, val);
    });

    // 修正引入路径
    // 1、默认为当前 location.href
    // 2、有id=projectnode，则相对当前script引入路径，有data-rel=""属性，就从当前引入路径寻找相对路径
    // 3、有设置的，使用设置
    var node, base = data.basePath;
    var href = window.location.href.replace(/\?.*$/g, "");
    if(base){
        if(!path.isAbsolute(base)){
            data.basePath = path.join(path.dir(href), base);
        }
    }else{
        node = document.getElementById("projectnode");
        if(node){
            // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
            var base = path.dir(node.hasAttribute ? node.src : node.getAttribute("src", 4));
            var rel = node.getAttribute("data-rel")
            if(rel){
                base = path.join(base, rel);
            };
            data.basePath = base;
        }else{
            data.basePath = path.dir(href);
        }
    };
    node = null;

    // 路径模板
    pathFormat = Format(data);
};

// 仅且加载一个
function requireOne(url, callback){
    url = concatFilePath(url);
    // 获取 def 对象
    var def = queryDeferred(url);
    if(def && def.loaded == 1){
        isFunction(callback) && callback(def.exports);
        return def.exports;
    }else{
        // loaded = -1，则是 define 定义的，已经有 exports 的
        // loaded = 0，则是未加载的，没有 exports 的
        var ext = path.ext(url), fn;
        if(def.loaded < 0){
            fn = function(url, next){
                next(def.exports, true);
            };
        }else{
            fn = requireMap[ext] || requireMap["default"];
        };
        fn(url, function(res, isFromScript){
            if(isFromScript){
                // 0 代表没加载过内容
                // -1 和 1 代表内容已经加载过了
                if(def.loaded == 0){
                    res = res || defineRes;
                }else{
                    res = def.exports;
                }
                defineRes = null;
                if(isFunction(res)){
                    if(res.length == 3){
                        // 预先加载
                        parseBeforeExecute(path.dir(url), res, function(fn){
                            var mod = {exports: {}};
                            res(createiRequire(url), mod.exports, mod);
                            res = mod.exports;
                            next(res);
                        });
                    }else{
                        // 内置字符串
                        next(queryFnInnerText(res));
                    }
                }else{
                    next(res);
                }
                return;
            }
            next(res);
        }, ext);
        // 处理完毕
        function next(res){
            def.rs(1, res);
            isFunction(callback) && callback(res);
        };
    }
};

// 文件加载，可加载多个
// require("文件1", "文件2", 回调);
function require(){
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
function define(name, fn){
    var len = arguments.length;
    if(len == 1){
        // Try to derive uri in IE6-9 for anonymous modules
        if (document.attachEvent && typeof getCurrentScript !== "undefined") {
            var url = getCurrentScript();
            var def = queryDeferred(url);
            // IE 6 -9 下，可能会延迟加载完成
            def.rs(-1, name);
        }else{
            defineRes = name;
        }
    }else{
        var def = queryDeferred(name);
        // 如果是 函数，可能完成了加载
        def.rs(-1, fn);
    };
};


// 文件执行前，对路径进行预解析
function parseBeforeExecute(dir, fn, callback){
    if(isFunction(fn)){
        // 把注视删除
        var str = fn.toString().replace(/\/\*(.|\n|\s)*?\*\/|\/\/[^\n\r]*/g, "");
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
    function ir(url, callback){
        // 名字 或 绝对路径
        var absoluteUrl = concatFilePath(url, dir), args = arguments;
        return args.length <= 1 ? requireOne(absoluteUrl, callback) : ir.async.apply(ir, args);
    };
    // 链接
    ir.url = function(url){
        return concatFilePath(url, dir);
    };
    extend(ir, innerRequireFns);
    return ir;
};
// 内置 require 的方法
var innerRequireFns = {
    // 异步请求
    async: function(){
        // 修正一次路径
        // 然后调用 loader.require
        var args = [].slice.call(arguments, 0), item;
        for(var i = 0, max = args.length; i < max; i++){
            item = args[i];
            typeof item === "string" && (args[i] = this.url(item));
        };
        require.apply(this, args);
    },
	css: function(url){
        // 路径必须要先 绝对化
		url = this.url(url);
		if(!cssMap[url]){
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = url;
			head.appendChild(link);
		};
	}
};
// 添加内置 require 的方法
function addInnerRequire(name, fn){
    innerRequireFns[name] = fn;
};

// 合并文件路径
// 让 文件 路径，支持模板计算方法
var pathFormat;
function concatFilePath(url, dir){
    // 路径模版化
    url = pathFormat(url);
    if(loaded[url]){
        return url;
    };
    if(path.isAbsolute(url)){
        return url;
    }else{
        return path.join(dir || data.basePath, url);
    }
};

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
// 添加文件 处理器
function addProcesser(type, fn){
    requireMap[type] = isFunction(fn) ? fn : requireMap[fn];
};


// 初始配置
config(window.Project || {});

window.require = require;
window.define = define;
window.require.config = config;
window.require.addProcesser = addProcesser;
window.require.addInnerMethod = addInnerRequire;
window.require.ajax = ajax;

})(window);