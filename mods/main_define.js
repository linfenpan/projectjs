// 依赖 main_config.js
var windowDefine;
;(function(window){

// @example:
//  define("moduleA", "test"); --> {url: "moduleA", exports: "test", state: FINISH}
//  define("moduleB", function(require, exports, module){ exports.data = 123; }); --> {url: "moduleB", exports: {data: 123}, state: FINISH}
//  define("test2"); --> {url: "此函数的链接", exports: "test2", state: FINISH};
//  define(function(require, exports, module){ exports.data = 123; }); --> {url: "此函数的链接", exports: {data: 123}, state: FINISH};
//  define(function(){},url);  --> {url: url, exports: }
function define(moduleName, fn, requireUrl){
    var argsLength = arguments.length;
    switch (argsLength) {
        case 1:
            fn = moduleName;
            defineWithoutName(fn);
            break;
        case 2:
            defineWithName(moduleName, fn);
            break;
        default:
            if (!isFunction(fn)) {
                requireUrl = EMPTY;
            }
            defineWithName(moduleName, fn, requireUrl);
            break;
    };
};

function defineWithName(moduleName, fn, requireUrl){
    var module = getRequireModule(moduleName);
    if (!isFunction(fn)) {
        module.state = FINISH;
    }
    module.exports = fn;

    requireUrl = requireUrl || "";
    var basePathReg = /^\/\//;
    if (requireUrl) {
        if (basePathReg.test(requireUrl)) {
            requireUrl = requireUrl.replace(basePathReg, requireBasePath);
        }
        module.url = path.join(requireUrl, "/");
    }
};

function defineWithoutName(func){
    defineResult = EMPTY;
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
