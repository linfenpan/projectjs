var loadScript, getCurrentScriptUrl;

// 脚本下载
;(function(window){
    function getNodeSrc(node){
        return node.getAttribute("src");
    };

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

        // 在 ie6-9 下，脚本，如果脚本有缓存，则会在插入的时候，立刻运行
        // 用 interactiveScript 暂时记录下当前的链接，可以有效的传递当前运行脚本地址
        currentAddingScript = script;
        // ref: http://dev.jquery.com/ticket/2709
        eBase ?
            eHead.insertBefore(script, eBase) :
            eHead.appendChild(script);
        currentAddingScript = EMPTY;

    };

    // this 对象，是当前的 script
    function onLoad(error){
        var script = this;
        var src = getNodeSrc(script);
        // @bug ie9下，须先 removeChild，再callback
        // 以防在 require相互嵌套时 getCurrentScriptUrl() 方法，获取到错误的脚本链接
        eHead.removeChild(script);
        script.onload = script.onerror = script.onreadystatechange = EMPTY;

        each(loadedMap[src], function(callback, index){
            callback(error, src);
        });
        loadedMap[src] = EMPTY;
    };

    // 获取当前加载的脚本 URL
    var currentAddingScript;
    var interactiveScript;
    function _getCurrentScriptUrl(){
        if (currentAddingScript) {
            return getNodeSrc(currentAddingScript);
        }

        // IE6 - 9 的浏览器，script.onload 之后，脚本可能还没执行完成
        // 判断当前 interactive[未执行完毕] 状态的节点，可知道当前运行的脚本
        var interactiveState = "interactive";
        if (interactiveScript && interactiveScript.readyState == interactiveState) {
            return getNodeSrc(interactiveScript);
        }

        var scripts = eHead.getElementsByTagName("script");
        for (var i = scripts.length - 1; i >= 0; i--) {
            var script = scripts[i]
            if (script.readyState == interactiveState) {
                interactiveScript = script;
                return getNodeSrc(interactiveScript);
            }
        }
    };

    loadScript = _loadScript;
    getCurrentScriptUrl = _getCurrentScriptUrl;
})(window);
