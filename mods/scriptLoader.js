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
