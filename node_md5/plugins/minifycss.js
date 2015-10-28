'use strict';
module.exports = function(PM){
    var CleanCSS = require('clean-css');
    PM.setPlugins("minifycss", function(target, list, options){
        var fs = this.fs;
        list.forEach(function(file){
            var code = new CleanCSS().minify(fs.readFileSync(file)).styles;
            fs.outputFileSync(file, code);
        });
    });
};
