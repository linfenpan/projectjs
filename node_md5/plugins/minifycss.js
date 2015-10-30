'use strict';
module.exports = function(PM, name){
    var CleanCSS = require('clean-css');
    PM.setPlugins(name || "minifycss", function(target, list, options){
        var fs = this.fs;
        list.forEach(function(file){
            var code = new CleanCSS().minify(fs.readFileSync(file)).styles;
            fs.outputFileSync(file, code);
        });
    });
};
