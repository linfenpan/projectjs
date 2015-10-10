var head = document.documentElement || document.getElementsByTagName("head")[0];
function loadScript(src, callback){
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
    head.appendChild(script);

    function onload(error){
        script.onload = script.onerror = script.onreadystatechange = null;
        head.removeChild(script);
        script = null;

        callback(error, src);
    };

};
