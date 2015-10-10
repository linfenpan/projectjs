// var data = require("../data/data.json"), style = require("../css/user.css");
//
// module.exports = {
//     user: data,
//     css: style
// };
define(function(require, exports, module){
    console.log("进来这里了..");
    var data = require("../data/data.json", function(data){
        console.log(data);
    });
    exports.age = 11;
    exports.style = require("user.css.js");
    console.log(exports.style);
});
