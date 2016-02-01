define("innerData12", function(require, exports, module){
    console.log("data12.js url: " + module.url);
    module.exports = require("data12.test.js");
});

define(function(require, exports, module){
    module.exports = require("innerData12");
});
