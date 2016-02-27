;(function(windowRequire){

// 加载样式
var loadingMap = {  };
var loadedMap = {  };
var eHead = document.head || document.getElementsByTagName("head")[0];
function loadLink(href, callback){
    callback = callback || windowRequire.noop;
    // 1. 已加载成功，立刻回调
    // 2. 正在加载，压入栈
    // 3. 没加载，创建栈
    if (loadedMap[href]) {
        callback();
    } else {
        var stack = loadingMap[href];
        var link;
        if (!stack) {
            stack = loadingMap[href] = [];
            link = createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.onload = function(){
                var callbacks = stack;
                for (var i = 0, max = callbacks.length; i < max; i++) {
                    callbacks[i]();
                }
                loadingMap[href] = null;
            };
        }
        stack.push(callback);
        link && eHead.appendChild(link);
    }
};

var loaderName = "css";
windowRequire.addExtension(loaderName, function(href){
    loadLink(this.url(href));
});
windowRequire.loader.add(loaderName, function(url, callback){
    loadLink(url, callback);
});

})(require);
