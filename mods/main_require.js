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
        return path.join(dirPath || requireBasePath, url);
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

    loadAllModules(requireBasePath, modules, callback);
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
    } else {
        module.exports = defineResult;
    }
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
