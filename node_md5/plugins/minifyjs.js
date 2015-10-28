'use strict';
module.exports = function(PM){
    var uglify = require("uglify-js");
    PM.setPlugins("minifyjs", function(target, list, options){
        var fs = this.fs;
        list.forEach(function(file){
            var code = uglify.minify(file, options).code;
            fs.outputFileSync(file, code);
        });
    });
};
