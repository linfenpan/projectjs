// var data = require("../data/data.json"), style = require("../css/user.css");
//
// module.exports = {
//     user: data,
//     css: style
// };
define(function(require, exports, module){
    exports.name = "Project.js";
    exports.version = "1.0.0";
    exports.style = require("../css/user.css");
    exports.otherCss = require("./user.css.js");
});
