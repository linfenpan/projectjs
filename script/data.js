define(function(require, exports, module){
    module.exports = {
        data: require("../data/data.json"),
        style: require("../css/user.css")
    };
    var user = require("user.js");

    console.log(require("$"));
    console.log(require("data"));
    // console.log(require.url("./data2.js"));

    require.async("./data2.js", function(data2){
        console.log("加载data2", data2)
    });

    // console.log(require("./data2.js"));

    // require("http://www.100bt.com/resource/js/lib/jquery-min.js");
});

define("data", "这是个数据");
