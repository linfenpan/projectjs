// 异步请求封装
var ajax;
;(function(window){
    var newAjax;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        newAjax = function(){
            return new XMLHttpRequest()
        };
    } else {// code for IE6, IE5
        newAjax = function(){
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
    };

    function concatUrlWithParam(url, params){
        var search = [];
        each(params, function(value, key){
            search.push(key + "=" + value);
        });
        search = search.join("&");
        if (search) {
            search = (/\?/.test(url) ? "&" : "?") + search;
        }
        return url + search;
    };

    // 只发送 get 请求
    ajax = function(url, params, callback){
        var xmlHttp = newAjax();

        if (isFunction(params)) {
            callback = params;
            params = {};
        } else {
            params = params || {};
            callback =  callback || noop;
        }

        xmlHttp.onreadystatechange = function(){
            // 4 = "loaded"
            // 200 = "OK", 302 = "not modify"
            if (xmlHttp.readyState == 4) {
                xmlHttp.onreadystatechange = null;
                var status = xmlHttp.status;
                if (status == 200 || status == 302) {
                    callback(false, this.responseText, this, url);
                } else {
                    callback(true);
                }
            }
        };

        var method = (params.method || "GET").toUpperCase();
        var aSync = params.sync === true ? false : true;
        var data = params.data || {};

        if (method === "GET") {
            xmlHttp.open(method, concatUrlWithParam(url, data), aSync);
            xmlHttp.send(null);
        } else {
            xmlHttp.open(method, url, aSync);
            // 设置格式为表单提交
            xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		    xmlHttp.send(data);
        }
    };
})(window);
