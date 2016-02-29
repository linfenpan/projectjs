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
            scriptNode = EMPTY;

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
