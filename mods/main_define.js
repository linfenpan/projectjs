// 依赖 main_config.js
var windowDefine;
;(function(window){

// 无论那种模式下，都会先执行 define 操作，才会运行 script onload
// @example:
//  define("moduleA", "test"); --> {url: "moduleA", exports: "test", state: FINISH}
//  define("moduleB", function(require, exports, module){ exports.data = 123; }); --> {url: "moduleB", exports: {data: 123}, state: FINISH}
//  define("test2"); --> {url: "此函数的链接", exports: "test2", state: FINISH};
//  define(function(require, exports, module){ exports.data = 123; }); --> {url: "此函数的链接", exports: {data: 123}, state: FINISH};
// @notice 下面功能，用于测试，如果没有，将在以后版本删除
//  define(function(){},url);  --> { url: url, exports: }
//  define(moduleName, function(){}, url);  --> {url: url, exports: }
function define(moduleName, fn, requireUrl){
    var argsLength = arguments.length;
    if (isString(moduleName) && argsLength > 1) {
        defineWithName(moduleName, fn, requireUrl);
    } else {
        requireUrl = fn;
        fn = moduleName;
        defineWithoutName(fn, requireUrl);
    }
};

function defineWithName(moduleName, fn, requireUrl){
    var module = getRequireModule(moduleName);
    if (!isFunction(fn)) {
        module.state = FINISH;
    }
    module.exports = fn;

    if (requireUrl) {
        module.url = queryRequireUrl(requireUrl);
    } else {
        if (isScriptExecuteDelayMode) {
            var url = getCurrentScriptUrl();
            module.url = url;
        } else {
            // 压入盏中，在 require 的分析中，再插入对应的 url
            defineFns.push(module);
        }
    }
};

function defineWithoutName(func, requireUrl){
    defineResult = EMPTY;
    if (isScriptExecuteDelayMode) {
        // 脚本延迟执行模式下，script 执行完之后，不会立刻执行 onload 事件，而是会有一定延后，或者等待其它脚本执行完毕，才会触发自己的 onload 事件
        //  估计，是 async 不生效的缘故吧
        var url = getCurrentScriptUrl();
        var module = getRequireModule(url);
        module.exports = func;

        if (requireUrl) {
            module.url = queryRequireUrl(requireUrl);
        }
    } else {
        // 这个结果，会被 scriptLoadedFinish 抓住，并使用
        defineResult = func;
    }
};

function queryRequireUrl(url){
    var requireUrl = url || "";
    var basePathReg = /^\/\//;
    if (requireUrl) {
        if (basePathReg.test(requireUrl)) {
            requireUrl = requireUrl.replace(basePathReg, requireBasePath);
        }
        requireUrl = path.join(requireUrl, "/");
    }
    return requireUrl;
};

windowDefine = define;

})(window);
