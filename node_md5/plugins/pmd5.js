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
            * options: {
                length: 8,
                fix: ["**"],
                cwd: "./test/dest/",
                inline: "__url"链接注入,
                pm: {project.js的参数},
                fixMap: {jsp: "html"} jsp 按 html 的模式修正
            }
            * files: ["*"]
         */
        options.fixMap = options.fixMap || {html: "html", htm: "html", css: "css", js: "js"};
        options.inline = options.inline || "__url";
        options.inline = new RegExp(`\\b${options.inline}\\(\\s*("|')(.*?)\\1\\s*\\)`, "gm");

        var map = {};
        list.forEach(function(url){
            var md5 = get_md5(fs.readFileSync(url).toString(), options.length);
            var obj = path.parse(url);
            obj.name += "_" + md5;
            obj.base = obj.name + obj.ext;
            var newUrl = path.format(obj);

            map[path.relative(options.cwd, url)] = path.relative(options.cwd, newUrl);
            fs.renameSync(url, newUrl);
        });

        // 修正列表
        var fixList = this.find(options.fix || "*", options.cwd, {matchLast: true});
        fixList.forEach(function(file){
            console.log(file)
            var ext = path.extname(file).toLowerCase().slice(1);
            // TODO 其它后缀，也需要修正?
            ext = options.fixMap[ext] || ext;
            // 脚本需要特殊修正
            // 其它的，没区别
            var fn;
            switch(ext){
                case "html":
                    fn = function(){
                        return fixHtml.apply(this, [].slice.call(arguments, 0).concat([options.pm || {}]));
                    };
                    break;
                case "css":
                    fn = fixCss;
                    break;
                case "js":
                    fn = function(){
                        return fixJs.apply(this, [].slice.call(arguments, 0).concat([options.pm || {}]));
                    };
                    break;
            }
            fn && checkNeedFix(file, options.cwd, map, fn, options);
        });
    });
};

function checkNeedFix(file, cwd, map, fn, options){
    var filePath = path.dirname(file);
    var res = fn(fs.readFileSync(file).toString(), filePath, cwd, map);
    if(res.need){
        res.text = res.text.replace(options.inline, function(str, xxx, key){
            var nstr = checkNeedToReplace(key, filePath, cwd, map);
            return `"${nstr}"`;
        });
        fs.writeFileSync(file, res.text);
    }
};

// 检查是否需要替换，需要，则返回正确地址，不需要，则返回原地址
function checkNeedToReplace(src, filePath, cwd, map){
    src = src.trim();
    var rel = path.relative(cwd, path.join(filePath, src));
    var str = src;
    if(map[rel]){
        str = path.relative(filePath, path.join(cwd, map[rel])).replace(/\\/g, "/");
    }
    return str;
};

// 修正 html 内容
function fixHtml(html, filePath, cwd, map, options){
    var need = false;
    // 修正所有 html 的属性
    // 虽然很低效，但是，我喜欢
    html = html.replace(/([^\s]+?=)("|')(.+?)\2/g, function(str, pre, xxx, key){
        var str = checkNeedToReplace(key, filePath, cwd, map);
        if(str === key){need = true;}
        return `${pre}"${str}"`;
    });
    // 修正内部 样式
    var fixCssRes = fixCss(html, filePath, cwd, map);
    fixCssRes.need && (html = fixCssRes.text);
    // 修正内部 脚本
    var fixJsRes = fixJs(html, filePath, cwd, map, options);
    fixJsRes.need && (html = fixJsRes.text);

    return {need, text: html};
};

// 修正 样式
function fixCss(css, filePath, cwd, map){
    var need = false;
    css = css.replace(/\burl\s*\(\s*(["']?)(.*)?\1\s*\)/gi, function(str, xxx, key){
        need = true;
        var str = checkNeedToReplace(key, filePath, cwd, map);
        if(str !== key){need = true;}
        return `url(${str})`;
    });
    return {need, text: css}
}

// 修正脚本
// 脚本理论上，不应该有任何 资源文件的!!!!!
// 不过，这里是修正 require("资源路径") 的文件咧..
function fixJs(js, filePath, cwd, map, options){
    var need = false;
    // project.js 中，有模板字符的方法，我觉得，这里，坑到自己了
    var format = getScriptFormat(options || {});

    var reg = /\brequire(\.url|\.css|\.async)?\s*\((\s*(\s*("|').*?\4\s*,?)+)/gm;
    js = js.replace(reg, function(str, method, params){
        params = params.replace(/\n|\r/g, "");
        var arr = params.split(",");
        var res = [];
        arr.forEach(function(url){
            url = url.trim().replace(/^["']|["']$/g, "");
            if(url){
                url = format(url);
                var str = checkNeedToReplace(url, filePath, cwd, map);
                if(url !== str){
                    need = true;
                }
                res.push(`"${str}", `);
            }
        });
        return "require" + (method || "") + "(" + res.join("");
    });
    return {need, text: js}
};
// project.js 的模板方法
function getScriptFormat(data){
    var str = "";
    for(var i in data){
        str += "var " + i + " = \"" + data[i].toString().replace(/(")/g, "\$1") + "\";\n"
    };
    str += 'return str.replace(/\\${([^}]*)}/g, function(str, key){\ntry{return eval(key);}catch(e){return ""};\n});\n';
    return new Function("str", str);
};
