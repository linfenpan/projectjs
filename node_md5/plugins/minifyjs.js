'use strict';
module.exports = function(PM, name){
    var uglify = require("uglify-js");
    PM.setPlugins(name || "minifyjs", function(target, list, options){
        var fs = this.fs;
        list.forEach(function(file){
            var code = uglify.minify(file, options).code;
            fs.outputFileSync(file, code);
        });
    });
};
