// var data = require("../data/data.json"), style = require("../css/user.css");
//
// module.exports = {
//     user: data,
//     css: style
// };
define(function(require, exports, module){
    exports.name = "Project.js";
    exports.version = "1.0.0";
    require.css("../css/user.css");
    // 这是异步请求了
    exports.otherCss = require("./user.css.js", function(text, json){
        console.log("css样式:" + text);
    });
});
