"use strict";
var path = require("path");
var fs = require("fs");
module.exports = function(PM){
    var md5 = require("crypto-js/md5");
    function get_md5(str, len){
        return md5(str).toString().substring(0, len || 8);
    };
    PM.setPlugins("pmd5", function(target, list, options){
        /**
            * options: {length: 8, fix: ["**"], cwd: "./test/dest/"}
            * files: ["*"]
         */
        var map = {};
        list.forEach(function(url){
            var md5 = get_md5(fs.readFileSync(url).toString(), options.length);
            var obj = path.parse(url);
            obj.name += "_" + md5;
            obj.base = obj.name + obj.ext;
            var newUrl = path.format(obj);

            map[path.relative(options.cwd, url)] = path.relative(options.cwd, newUrl);
            // fs.renameSync(url, newUrl);
        });

        // 修正列表
        var fixList = this.find(options.fix || "*", options.cwd, {matchLast: true});
        fixList.forEach(function(file){
            console.log(file)
            var ext = path.extname(file).toLowerCase().slice(1);
            // TODO 其它后缀，也需要修正?
            // 脚本需要特殊修正
            // 其它的，没区别
            console.log(ext)
            switch(ext){
                case "html":
                    checkNeedFix(file, options.cwd, map, fixHtml);
                    break;
                case "css":
                    break;
                case "js":
                    break;
            }
        });
    });
};

function checkNeedFix(file, cwd, map, fn){
    var res = fn(fs.readFileSync(file).toString(), path.dirname(path.relative(cwd, file)), map);
    if(res.need){
        fs.writeFileSync(file, res.text);
    }
}

// 修正 html 内容
function fixHtml(html, cwd, map){
    var need = false;
    // 修正 link 和 script
    html = html.replace(/(link.+?href\s*=["'])(.*?)(["'])/gi, function(str, pre, url, suf){
        need = true;

        var rel = path.join(cwd, url);
        return pre + (map[rel] || url) + suf;
    }).replace(/(<script.*?src=)(["|'])(.*?)\2(.*?)>/gi, function(str, pre, xxx, src, suf){
        need = true;

        var rel = path.join(cwd, src);
        return `${pre}"${map[rel] || src}"${suf}`;
    });
    console.log(html);
    return {need, text: html};
}
