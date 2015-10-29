"user strict";
// 文件的简单复制
var path = require("path");

module.exports = function(PM){
    PM.setPlugins("copy", function(target, list, options){
        // console.log(target, list, options);
        var fs = this.fs;
        var toPath = path.join(options.cwd, target.path);
        if(target.isFile){
            toPath = path.dirname(toPath);
        }
        fs.ensureDirSync(toPath);
    	list.forEach(function(item){
    		// copySync 只能 文件夹 -> 文件夹
    		// 文件 -> 文件
            var t = path.join(toPath, path.basename(item));
            fs.copySync(item, t);
            this.log(`from:${item}\nto  :${t}`);
        }.bind(this));

        this.log("\n");
    });
};
