define("innerData12", function(require, exports, module){
    console.log("data12.js url: " + module.url);
    module.exports = require("data12.test.js");
});

define(function(require, exports, module){
    console.warn("在脚本中，同时 define('moduleName', fn) 是不安全的，要确认，在出口define中，把所有其它define文件，引入至少1次，以保证它们的路径是正确的");
    // 如果下面不 require("innerData12")，那么 innerData12 中 require 的寻址路径，将会是第一次调用它的脚本，所处的寻址路径
    module.exports = require("innerData12");
});
