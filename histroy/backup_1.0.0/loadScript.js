var eHead = document.head || document.getElementsByTagName("head")[0];
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
    eHead.appendChild(script);

    function onload(error){
        script.onload = script.onerror = script.onreadystatechange = null;
        eHead.removeChild(script);
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
    var scripts = eHead.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
        var script = scripts[i]
        if (script.readyState === "interactive") {
            interactiveScript = script
            return interactiveScript.getAttribute("src");
        }
    }
};
