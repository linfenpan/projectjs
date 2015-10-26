var fs = require("fs-extra"), path = require("path"), vm = require("vm");
var utils = require("./lib/utils");

var basePath = path.join(__dirname, "./demo");
var html = fs.readFileSync(path.join(basePath, "./demo.html")).toString();

var rootPath = __dirname;
// 修复模板路径
var realPathFn = null;
// 已加载的板块
var loadMap = {};

// 外部的配置文件
var config = {
    path: {
        basePath: "./"
    },
    other: {
        "$": "哈哈"
    }
};

// 配置 和 前端一致
// 已经加载的
;(function(other, loadMap){
    for(var i in other){
        if(other.hasOwnProperty(i)){
            loadMap[i] = other[i];
        }
    }
})(config.other || {}, loadMap);

// 路径模板
;(function(cp, map){
    var format = utils.format(cp);
    realPathFn = function(r, dir){
        if(loadMap[r] || utils.isAbsolute(r)){
            return r;
        }
        r = r.replace(/(\?|#).*$/, "");
        if(dir && !path.isAbsolute(r)){
            r = path.join(dir, r);
        }
        return path.normalize(format(r));
    };
})(config.path || {}, loadMap);

// 最外层加载脚本列表
var loadedScriptList = {}, htmlScriptMap = {};
// 遍历所有脚本，进行深层次替换
html = html.replace(/(<script.*?src=)(["|'])(.*?)\2(.*?)>/g, function(str, pre, s1, src, suf){
    console.log(pre);
    console.log(suf);
    console.log(src);

    var url = path.join(basePath, src);
    // 查询相关脚本
    queryRequire(url);
    // 外部依赖脚本
    htmlScriptMap[url] = {type: "out", value: loadedScriptList[url], url: url};
    // TODO 脚本打包
    // TODO 脚本md5
    return  `${pre}"${src}"${suf}`;
});

console.log(loadedScriptList);
// 根据 htmlScriptMap 进行打包
function packupHtmlScript(map){
    // 清空加载 map
    for(var i in map){
        if(map.hasOwnProperty(i)){
            var item = map[i];
            switch(item.type){
                case "out":
                    // 外部脚本
                    var text = queryAllScripts(item.url, item.url);
                    // 这里写入前，可以打上 md5
                    var filePath = path.join(__dirname, "./dist/", path.basename(item.url));
                    fs.ensureFileSync(filePath);
                    fs.writeFileSync(filePath, text);
                    break;
                default:

            }
        }
    }
};
// 根据链接，查询所有内容
function queryAllScripts(url, root){
    var list = [], rely = loadedScriptList[url];
    if(rely){
        rely.forEach(function(url, index){
            list.push(queryAllScripts(url, root));
        });
    };
    var text = fs.readFileSync(url).toString();
    // 去注释
    var testTxt = utils.removeNotes(text), ext = path.extname(url).slice(1).toLowerCase();
    // 如果  text 不是脚本 或者 没有define的，那么，需要对它进行 1 轮加工
    if(ext == "json"){
        text = "define("+ text.replace(/^[\s\n\r;]*|[\s\n\r;]*$/g, "") +");";
    }else if(ext != "js" && !/\bdefine\(/.test(testTxt)){
        console.log(122222, url);
        text = "define(function(){/*!"+ testTxt +"*/});";
    };

    // 如果 define 没有 名字定义，给它一个!
    text = text.replace(/\bdefine\s*\(([^)({]*)/g, function(str, suffix){
        return str.split(",").length <= 1 ? "define(\"" + queryRelativePath(url) +"\"," + suffix : str;
    });
    // 如果you require，则修正他们的路径
    var dir = path.dirname(url);
    text = text.replace(/\brequire(?:\.([^(=]+?))?\(([^)]+?)\)/g, function(str, method, list){
        // console.log(str, list);
        if(list){
            var res = [];
            list = list.split(",");
            list.forEach(function(url){
                if(/^\s*(["'])[^"']+\1\s*$/.test(url)){
                    url = url.replace(/^\s*['"]|['"]\s*$/g, "");
                    url = realPathFn(url, dir);
                    // console.log(url);
                    res.push("\"" + queryRelativePath(url) + "\"");
                }else{
                    res.push(url);
                }
            });
            return "require"+ (method ? "." + method : "") +"(" + res.join(", ") + ")";
        }
        return str;
    });
    // TODO: 需要添加判断，如果加载过了，就不要再加载了
    list.push(text);
    return list.join("\n;\n");
};
// 获取 基于 basePath 的相对路径
function queryRelativePath(url){
    return url.replace(basePath, "${basePath}").replace(/\\/g, "/");
};

packupHtmlScript(htmlScriptMap);


// 1、读取脚本，查询 request
// 2、url 是绝对路径
// 3、return 当前页面的 request 列表
function queryRequire(url){
    if(loadMap[url]){
        return;
    }
    loadMap[url] = true;
    var list = loadedScriptList[url] = [], dirname = path.dirname(url);

    // 读取脚本
    var script = utils.removeNotes(fs.readFileSync(url).toString());
    // 找出所有 require(...)
    var requireReg = /\brequire\(["'](.+?)\)/g, res;
    while(res = requireReg.exec(script), res){
        // 找出 require("aaa.js", "bbb.js")
        res[1].replace(/([^'",\s]+?)['"]/g, function(str, s){
            // 如果 不是 ("xxx.js") 这种形式的，都属于需要遍历的脚本
            if(!(new RegExp("\\(.*?"+ str +".*?\\)")).test(s)){
                s = realPathFn(s);
                if(!utils.isAbsolute(s)){
                    s = path.join(dirname, s);
                }
                // console.log(222);
                if(!loadMap[s]){
                    queryRequire(s);
                };
                list.push(s);
            };
            return "";
        });
    };
};



// console.log(html);
