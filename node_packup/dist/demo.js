define("${basePath}/data/data.json",{
    "name": "da宗熊",
    "age" : 26,
    "email": "1071093121@qq.com"
});
;
define("${basePath}/css/user.css",function(){/*!p{font-size:14px;}
a{color:#f00;}
*/});
;
define("${basePath}/script/data.js",function(require, exports, module){
    module.exports = {
        data: require("${basePath}/data/data.json"),
        css: require("${basePath}/css/user.css")
    }
});

;
define("${basePath}/script/user.css.js",function(){
/*!
    .user{font-weight:bold;}
    .user .ico{float:left;width:50px;height:50px;}
*/
});

;
// var data = require("${basePath}/data/data.json"), style = require("${basePath}/css/user.css");
//
// module.exports = {
//     user: data,
//     css: style
// };
define("${basePath}/script/user.js",function(require, exports, module){
    exports.name = "Project.js";
    exports.version = "1.0.0";
    require.css("${basePath}/css/user.css");
    // 这是异步请求了
    exports.otherCss = require("${basePath}/script/user.css.js",  function(text,  json){
        console.log("css样式:" + text);
    });
});

;
require("${basePath}/script/data.js", "${basePath}/script/user.js",  function(data,  user){
    console.log(data);
    console.log(user);
});
