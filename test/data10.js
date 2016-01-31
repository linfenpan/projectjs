define(function(require, exports, module){
    exports.url = require.url("./data10.js");
    console.log("inner data10中，此脚本链接:" + module.url);
});
