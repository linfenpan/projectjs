define("data5", "data5 inner 数据");
define(function(require, exports, module){
    exports.outer = require("./data5.test.js");
    exports.inner = require("data5");
});
