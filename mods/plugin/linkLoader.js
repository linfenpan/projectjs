;(function(windowRequire){

// 加载样式
var linkLoadedMap = {};
var eHead = document.head || document.getElementsByTagName("head")[0];
function loadLink(href, callback){
    callback = callback || windowRequire.noop;
    if (!linkLoadedMap[href]) {
        linkLoadedMap[href] = 1;
        var link = createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = callback;
        eHead.appendChild(link);
    } else {
        callback();
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
