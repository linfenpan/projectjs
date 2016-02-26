/*! By da宗熊 2016-02-26 v1.1.4 https://github.com/linfenpan/projectM */
;(function(window){
var winDocument = window.document;
var eHead = winDocument.head || winDocument.getElementsByTagName("head")[0] || winDocument.documentElement;

var internalToString = Object.prototype.toString;
var internalSlice = [].slice;

var COMMENT_REGEXP = /("([^\\\"]|\\.)*")|('([^\\\']|\\.)*')|(\/{2,}.*?(\r|\n))|(\/\*(\n|.)*?\*\/)/g;

// @NOTICES: 考虑到代码压缩之后，eval里的"o."就没效了..没想到更好的，有大神指导不?
var template = Function("s", "o", "return s.replace(/{([^}]*)}/g,function(a,k){return eval('o.'+k)})");

function noop(){ /* 占位用的空函数 */ }

function queryType(obj){
    return internalToString.call(obj).split(" ")[1].toLowerCase().slice(0, -1);
};

function isFunction(obj){
    return queryType(obj) === "function";
};

function createElement(elem){
    return winDocument.createElement(elem);
}

function each(obj, callback){
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            callback && callback(obj[i], i, obj);
        }
    }
};

function combine(){
    var args = arguments;
    var source = args[0];
    args = internalSlice.call(args, 0);

    each(args, function(target){
        each(target, function(value, key){
            var type = queryType(value);
            switch (type) {
                case "object":
                    source[key] = {};
                    combine(source[key], value);
                    break;
                case "array":
                    source[key] = [];
                    combine(source[key], value);
                    break;
                default:
                    source[key] = value;
            }
        });
    });

    return source;
};

function trim(str){
    return str.replace(/^\s*|\s*$/g, "");
};

// 绝对路径
function isAbsolute(url){
    return path.isAbsolute(url);
};

function removeComment(str){
    return str.replace(COMMENT_REGEXP, function(word) {
        return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? "" : word;
    });
};

// 路径解析

// test.json!txt  --> 匹配 !txt
var SUFFIX_EXTRA_REG = /![^!]+$/;
// test.json?xx --> test.json
function removeUrlSeachAndHash(uri){
    return uri.replace(/(\?|#).*$/, "");
};
var path = {
    // 路径格式化
    normal: function(uri){
        // 1. ./a/./b//c/d/../e/ ==> ./a//b//c/d/../e/
        // 2. ./a//b/c/d/../e/ ==> ./a/b/c/d/../e/
        // 3. ./a/b/c/d/../e/ ==> ./a/b/c/e/
        return uri.replace(/\/\.\//g, "\/\/").replace(/([^:])\/{2,}/g, "$1\/").replace(/[^/]+\/\.\.\/([^/]*)/g, "$1");
    },
    // 是否绝对路径, ftp:// 或 http:// ，不过 // 这种不知道算不算呢?
    isAbsolute: function(uri){
        return /:\/\//.test(uri);
    },
    // 路径合并
    join: function(){
        return path.normal([].join.call(arguments, "\/"));
    },
    // 目录，http://www.100bt.com 这样的，会有BUG，现实不存在这样的路径，先无视
    //  删除 search 和 hash 部分
    dir: function(uri){
        return removeUrlSeachAndHash(uri).replace(/(.*\/).*$/, "$1");
    },
    root: function(uri){
        // http://www.baidu.com/xxx/index.html --> http://www.baidu.com/
        var res = uri.match(/.*:\/{2,}.*?(\/|$)/g);
        return res ? res[0] : "";
    },
    // 后缀名
    ext: function(uri){
        // test.txt!js  --> "!js"
        // test.json --> "json"
        var ext = uri.match(SUFFIX_EXTRA_REG);
        if (ext) {
            return ext[0].slice(1);
        } else {
            uri = removeUrlSeachAndHash(uri);
            return uri.match(/\.([^.]*)$/)[1];
        }
    },
    clearExtra: function(uri){
        return uri.replace(SUFFIX_EXTRA_REG, "");
    }
};

var loadScript, getCurrentScriptUrl;

// 脚本下载
;(function(window){
    var loadedMap = {  };

    function _loadScript(src, callback){
        if (loadedMap[src]) {
            loadedMap[src].push(callback);
            return;
        }
        loadedMap[src] = [callback];
        createScript(src);
    };

    function createScript(src){
        var script = createElement("script");
        script.async = true;
        script.type= 'text/javascript';

        // 如果支持 onload
        if ("onload" in script) {
            script.onload = function(){
                onLoad.call(script, false);
            };
            script.onerror = function(){
                onLoad.call(script, true);
            };
        } else {
            script.onreadystatechange = function(){
                if (/loaded|complete/.test(script.readyState)) {
                    onLoad.call(script);
                }
            }
        };

        script.src = src;
        eHead.appendChild(script);
    };

    // this 对象，是当前的 script
    function onLoad(error){
        var script = this;
        script.onload = script.onerror = script.onreadystatechange = null;
        var src = script.getAttribute("src");

        each(loadedMap[src], function(callback, index){
            callback(error, src);
        });

        eHead.removeChild(script);
        loadedMap[src] = null;
    };

    // 获取当前加载的脚本 URL
    var interactiveScript;
    function _getCurrentScriptUrl(){
        // IE6 - 9 的浏览器，script.onload 之后，脚本可能还没执行完成
        // 判断当前 interactive[未执行完毕] 状态的节点，可知道当前运行的脚本
        var interactiveState = "interactive";
        if (interactiveScript && interactiveScript.readyState == interactiveState) {
            return interactiveScript.getAttribute("src");
        }
        var scripts = eHead.getElementsByTagName("script");
        for (var i = scripts.length - 1; i >= 0; i--) {
            var script = scripts[i]
            if (script.readyState == interactiveState) {
                interactiveScript = script
                return interactiveScript.getAttribute("src");
            }
        }
    };

    loadScript = _loadScript;
    getCurrentScriptUrl = _getCurrentScriptUrl;
})(window);

// 注释的正则，含多行与单行注释
var REQUIRE_REGEXP = /[^.]require\(["']([^'"]+)["']\)/g;

// require 路径解析时，使用的模板数据
var requireTemplateData = {  };
// require 寻址基础路径
var requireBasePath;
// 已加载完成的模块
var requireLoadedModule = {  };
// require 中，设置的module依赖别名
var requireModuleAlias = {  };
// require 中，最近加载的链接
var requireRecentLoadUrl;
// 模块状态
var FINISH = 1, LOADING = 0;
// require 额外拓展的功能
var requireExtension = {};

// 当require加载板块时，如果新板块有 define 函数，则会把 define 的结构，记录在这里
var defineResult;
// 怪异的 define 模式，在此模式下，js加载完成后，并不会立刻运行
var isScriptExecuteDelayMode = !!winDocument.attachEvent;

// @require("main_global.js");

// 找到 requireBasePath，初始化 requireTemplateData
var requireConfig;
;(function(window){
    function config(options){
        options = options || {};
        combine(requireTemplateData, options.template || {});
        combine(requireModuleAlias, options.alias || {});

        // 修正引入路径
        initBasePath(options);
    };

    // 修正引入路径
    // 1、默认为当前 location.href
    // 2、有id=seedNode，则相对当前script引入路径
    // 3、有设置的，使用设置
    function initBasePath(options){
        var pageURL = window.location.href;
        var basePath = options.basePath;

        if (basePath || !requireBasePath) {
            requireBasePath = path.dir(pageURL);

            // 如果有 seedNode，则基于 seedNode 进行寻址
            var scriptNode = winDocument.getElementById("seedNode");
            if (scriptNode) {
                // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
                var scriptSrc = path.dir(scriptNode.hasAttribute ? scriptNode.src : scriptNode.getAttribute("src", 4));
                pageURL = path.dir(scriptSrc);
            }
            scriptNode = null;

            if (basePath) {
                if (isAbsolute(basePath)) {
                    requireBasePath = basePath;
                } else {
                    requireBasePath = path.join(path.dir(pageURL), basePath, "/");
                }
            }
        }
    };

    requireConfig = config;
})(window);

// 依赖 main_config.js
var windowDefine;
;(function(window){

// @example:
//  define("moduleA", "test"); --> {url: "moduleA", exports: "test", state: FINISH}
//  define("moduleB", function(require, exports, module){ exports.data = 123; }); --> {url: "moduleB", exports: {data: 123}, state: FINISH}
//  define("test2"); --> {url: "此函数的链接", exports: "test2", state: FINISH};
//  define(function(require, exports, module){ exports.data = 123; }); --> {url: "此函数的链接", exports: {data: 123}, state: FINISH};
//  define(function(){ /*! 具体的html内容 */ }); --> {url: "此函数的链接", exports: "具体的html内容", state: FINISH};
function define(moduleName, func){
    if (arguments.length <= 1) {
        func = moduleName;
        moduleName = null;
        defineWithoutName(func);
    } else {
        defineWithName(moduleName, func);
    }
};

function defineWithName(moduleName, func){
    var module = getRequireModule(moduleName);
    if (!isFunction(func)) {
        module.state = FINISH;
    }
    module.exports = func;
    module.url = requireRecentLoadUrl || requireBasePath;
};

function defineWithoutName(func){
    defineResult = null;
    if (isScriptExecuteDelayMode) {
        // 脚本延迟执行模式下，script 执行完之后，不会立刻执行 onload 事件，而是会有一定延后，或者等待其它脚本执行完毕，才会触发自己的 onload 事件
        //  估计，是 async 不生效的缘故吧
        var url = getCurrentScriptUrl();
        var module = getRequireModule(url);
        module.exports = func;
    } else {
        // 这个结果，会被 scriptLoadedFinish 抓住，并使用
        defineResult = func;
    }
};

windowDefine = define;

})(window);

var windowRequrie;
var getRequireModule;

;(function(window){

// require 加载的模块
function initModule(url){
    if (!requireLoadedModule[url]) {
        var module;
        if (requireModuleAlias[url]) {
            module = {
                url: url,
                state: FINISH,
                exports: requireModuleAlias[url]
            };
        } else {
            module = {
                url: url,
                state: LOADING,
                exports: null
            };
        }
        requireLoadedModule[url] = module;
    };
    return requireLoadedModule[url];
};
function getModule(url){
    return initModule(url);
};

// 获取 module 的绝对路径
function getModuleAbsURL(url, dirPath){
    url = template(url, requireTemplateData);
    if (isAbsolute(url)) {
        return url;
    } else {
        dirPath = dirPath || requireBasePath;
        if (/^\//.test(url)) {
            dirPath = path.root(dirPath);
        }
        return path.join(dirPath, url);
    }
};

// 1. 模板化后 筛选 aliasMap 和 loadedMap [define(module, {})]
// 2. 不在别名中，就返回绝对路径
function queryRealModuleName(moduleName, dirPath){
    var alias = template(moduleName, requireTemplateData);
    if (!requireModuleAlias[alias] && !requireLoadedModule[alias]) {
        // 把 module 套模板数据后，再尝试匹配别名
        moduleName = getModuleAbsURL(moduleName, dirPath);
    }
    return moduleName;
};

function require(){
    var args = arguments;
    var callback = args[args.length - 1];

    // 最后一个参数，是回调函数
    var modules = internalSlice.call(args, 0);
    if (isFunction(callback)) {
        modules.pop();
    } else {
        callback = noop;
    }

    // 应对完全乱用的同学
    setTimeout(function(){
        loadAllModules(requireBasePath, modules, callback);
    });
};

function loadAllModules(dirPath, modules, callback){
    var args = [];
    var modulesCount = modules.length;
    each(modules, function(module, index){
        var moduleName = queryRealModuleName(module, dirPath);
        loadModule(moduleName, function(exports, module){
            args[index] = exports;
            modulesCount--;
            checkLoadFinish();
        });
    });
    function checkLoadFinish(){
        if (modulesCount <= 0){
            callback.apply(window, args);
            checkLoadFinish = noop;
        }
    };
    checkLoadFinish();
};

function loadModule(moduleName, callback){
    var module;
    // 别名模块，立刻返回
    if (requireModuleAlias[moduleName]) {
        module = initModule(moduleName);
        return callback(module.exports, module);
    }

    moduleName = queryRealModuleName(moduleName);
    module = initModule(moduleName);

    // 加载完成的模块，立刻返回
    var state = module.state;
    if (state == FINISH) {
        return callback(module.exports, module);
    }

    var extname, loadFn;
    if (isAbsolute(moduleName)) {
        extname = path.ext(moduleName).toLowerCase();
        loadFn = moduleLoader[extname] || moduleLoader._;
        module.url = path.clearExtra(module.url);
    } else {
        extname = "js";
        loadFn = function(name, callback){
            defineResult = module.exports;
            callback();
        };
        // module.url =
    }

    if (!loadFn) {
        throw "loader for suffix `"+ extname +"` is not defined";
    };

    loadFn(module.url, function(loadedData){
        switch (extname) {
            case "js":
                if (module.state !== FINISH) {
                    scriptLoadedFinish(moduleName, finish);
                } else {
                    finish(module.exports);
                }
                break;
            default:
                finish(loadedData);
        };
        function finish(data){
            module.state = FINISH;
            module.exports = data;
            callback(module.exports, module);
        };
    });
};

function scriptLoadedFinish(url, callback){
    requireRecentLoadUrl = isAbsolute(url) ? url : requireBasePath;
    var module = getModule(url);
    if (isScriptExecuteDelayMode) {
        defineResult = module.exports;
    }
    // 重复加载 两次脚本，在第1次脚本分析完成之前，status == LOADING..，但是内容却已经加载完成了
    module.exports = defineResult || module.exports;

    anlyseModuleExports(module, function(exports){
        callback(exports);
    });
    defineResult = null;
};

// module.exports & module.state == LOADING，exports 对应不同的格式，会输出不同的值
function anlyseModuleExports(module, callback){
    var exports = module.exports;
    var url = module.url;
    if (module.state === FINISH) {
        callback(exports);
    } else {
        if (isFunction(exports)) {
            anlyseFunctionRely(url, exports, function(result){
                module.state = FINISH;
                callback(result);
            });
        } else {
            module.state = FINISH;
            callback(exports);
        }
    }
};

// 分析函数依赖
function anlyseFunctionRely(url, exports, callback){
    var fnContent = exports.toString();
    // 1. 删除注释、换行、空格
    fnContent = removeComment(fnContent).replace(/\s*/g, "");
    // 2. 分析依赖
    var module;
    var needLoadModules = [];
    while(module = REQUIRE_REGEXP.exec(fnContent)){
        // require("moduleA", function(){}); --> 异步处理，忽略
        // require("moduleB"); --> 进行加载，当前处理的，就是这种模式
        needLoadModules.push(module[1]);
    }
    // 3. 加载依赖模块
    // 4. 执行 exports 得到最后的 结果
    var moduleDirPath = path.dir(url);
    loadAllModules(moduleDirPath, needLoadModules, function(){
        var module = {exports: {}, url: url};
        exports(createDefineRequire(moduleDirPath), module.exports, module);
        callback(module.exports);
    });
};

// 在 define 内部使用的 require
//  走到这里的 require("module"); 已经可以同步处理了
function createDefineRequire(dirPath){
    function innerRequire(module, callback){
        if (callback) {
            var args = internalSlice.call(arguments, 0);
            each(args, function(moduleName, index){
                args[index] = isFunction(moduleName) ? moduleName : queryRealModuleName(moduleName, dirPath);
            });
            require.apply(window, args);
        } else {
            return requireLoadedModule[queryRealModuleName(module, dirPath)].exports;
        }
    };
    extendRequire(innerRequire, dirPath);
    return innerRequire;
};

// moduleLoader._ 是默认的模块加载器
var moduleLoader = {
    js: function(url, callback){
        loadScript(url, function(error){
            if (error) {
                callback();
                throw "load `"+ url +"` fail!";
            } else {
                callback();
            }
        });
    },
    add: function(loaderName, func){
        moduleLoader[loaderName] = func;
    },
    setDefault: function(loaderName){
        moduleLoader._ = moduleLoader[loaderName];
    }
};
moduleLoader.setDefault("js");

// require 功能拓展
function extendRequire(require, dirPath){
    combine(require, {
        loader: moduleLoader,
        addExtension: addExtension,
        url: function(url){ return getModuleAbsURL(url, dirPath); }
    }, requireExtension);
};

// 添加拓展功能
function addExtension(name, extension){
    requireExtension[name] = extension;
    // window.require 是不会再次调用 extendRequire 的
    require[name] = extension;
};

extendRequire(require, requireBasePath);

getRequireModule = getModule;
windowRequrie = require;

})(window);

combine(windowRequrie, {
    config: requireConfig,
    loadScript: loadScript,
    noop: noop
});
window.require = windowRequrie;
window.define = windowDefine;

requireConfig();

})(window);