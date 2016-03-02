;(function(windowRequire){

// `onload` 事件，在 WebKit < 535.23 and Firefox < 9.0 下，不触发
//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
var userAgent = navigator.userAgent;
// SDK 浮点中的webview，把 agent 改为了 android/webview，大坑!!!
var isWebKit = /webkit|webview/i.test(userAgent);

function pollCss(node, callback) {
    var sheet = node.sheet
    var isLoaded

    // for WebKit
    if (isWebKit) {
        if (sheet) {
            isLoaded = true
        }
    }
    // for Firefox
    else if (sheet) {
        try {
            if (sheet.cssRules) {
                isLoaded = true
            }
        } catch (ex) {
            // The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
            // to "SecurityError" since Firefox 13.0.
            var name = ex.name;
            if (name == "NS_ERROR_DOM_SECURITY_ERR" || name == "SecurityError") {
                isLoaded = true;
            }
        }
    }
    isLoaded && callback();
};

function createLink(href, callback){
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;

    var linkReady = function(){
        link.onload = link.onerror = null;
        clearInterval(timer);
        callback();
    };

    var timer = setInterval(function(){
        pollCss(link, linkReady);
    }, 20);
    link.onload = link.onerror = linkReady;

    return link;
};

var loadingMap = {  };
var loadedMap = {  };
var eHead = document.head || document.getElementsByTagName("head")[0];

// 加载样式
function loadLink(href, callback){
    callback = callback || windowRequire.noop;
    // 1. 已加载成功，立刻回调
    // 2. 正在加载，压入栈
    // 3. 没加载，创建栈
    if (loadedMap[href]) {
        callback();
    } else {
        var stack = loadingMap[href] || [], link;

        if (stack.length <= 0) {
            link = createLink(href, function(){
                if (!stack) {
                    return;
                }
                var callbacks = stack;
                loadedMap[href] = true;
                loadingMap[href] = stack = null;
                var fn;
                while((fn = callbacks.pop(), fn)){
                    fn();
                };
            });
        };

        stack.push(callback);
        link && eHead.appendChild(link);
    }
};

var loaderName = "css";
windowRequire.addExtension(loaderName, function(href, callback){
    loadLink(this.url(href), callback);
});
windowRequire.loader.add(loaderName, function(href, callback){
    loadLink(href, callback);
});

})(require);
