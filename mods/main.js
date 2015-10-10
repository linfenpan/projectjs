var data = {basePath: null}; // 模板数据, basePath: "/"
var loaded = {};            // 加载完成的脚本
var basePath = "";

// 项目设置
if(window.Project){
    extend(data, window.Project.path || {});
    extend(loaded, window.Project.other || {});
};

// 计算基础路径
;(function(doc){
    if(data.basePath){
        basePath = data.basePath;
        if(!path.isAbsolute(basePath)){
            var link = document.createElement("a");
            link.setAttribute("href", basePath);
            basePath = link.hasAttribute ? link.href : link.getAttribute("href", 4);
        }
    }else{
        var script = doc.getElementById("projectnode") || doc.scripts[0];
        var i = 0;
        while(i++, !script.src){
            script = doc.scripts[i];
        }
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        basePath = path.dir(script.hasAttribute ? script.src : script.getAttribute("src", 4));
    }
})(window.document);

// 加载配置
// p 是路径
// next 是下一步的函数
// ext 是当前路径的后缀
var requireMap = {
    "js": function(p, next, ext){
        loadScript(p, function(error, url){
            if(error !== true){
                next(null, true);
            }
        });
    },
    "default": function(p, next, ext){
        ajax(p, function(error, url, text){
            if(error !== true){
                next(ext == "json" ? toJSON(text) : text);
            }
        });
    }
};

// 加载器
var loader = {};
loader.queryDeferred = function(url){
    if(loader[url]){
        return loader[url].def;
    }else{
        var def = new Callbacks({done: [1, "resolve"], always: 0});
        var item = loaded[url] = {
            def: def,
            exports: null
        };
        def.done(function(res){
            item.exports = res;
        });
        return def;
    }
};
// 文件加载
loader.require = function(url, callback){
    url = concatFilePath(url);
    if(loaded[url]){
        loaded[url].done(callback || function(){});
        return loaded[url].exports;
    }else{
        // 获取 def 对象
        var def = loader.queryDeferred(url);
        // 开始加载
        var ext = path.ext(url);
        var fn = requireMap[ext] || requireMap["default"];
        fn(url, function(res, isFromScript){
            if(isFromScript){
                res = defineRes;
                defineRes = null;
                // 预先加载
                parseBeforeExecute(path.dir(url), res, function(fn){
                    if(queryType(res) === "function"){
                        var module = {exports: {}};
                        res(createInnerRequire(url), module.exports, module);
                        res = module.exports;
                    }
                    next(res);
                });
            }else{
                next(res);
            }
        });
        // 处理完毕
        function next(res){
            def.resolve(res);
            callback && callback(res);
        };
    }
};

// 脚本如果调用了 define
var defineRes = null;
loader.define = function(name, fn){
    if(queryType(name) === "string"){
        var def = loader.queryDeferred(name);
        def.resolve(fn);
    }else{
        defineRes = name;
    }
};

// 添加文件 处理器
loader.addTypeProcesser = function(type, fn){
    requireMap[type] = queryType(fn) === "function" ? fn : (requireMap[fn] || requireMap["default"]);
};


// 文件执行前，对路径进行预解析
function parseBeforeExecute(dir, fn, callback){
    if(queryType(fn) === "function"){
        // 把注视删除
        var str = fn.toString().replace(/\/\*(.|\n|\s)*\*\/|\/\/[^\n\r]*/g, "");
        // 检测的正则
        var reg = /\brequire\s*\(([^)]*)\)/g;
        var res, readyCount = 0;
        while(res = reg.exec(str), res){
            // console.log(res[0], res[1]);
            var url = res[1];
            // 如果是 require("data.json")，进行加载
            // 如果是 require("data.json", function(){})，则忽略，等待异步加载
            if(/["']\s*,/.test(url)){
                // 忽略
            }else{
                // 计算器在这里加减，是因为全部是异步的时候，回调的 ready 没有执行的说
                url = url.replace(/"|'/g, "");
                readyCount++;
                require(concatFilePath(url, dir), function(){
                    readyCount--;
                    ready();
                });
            }
        };
        // 计算器为 0，执行回调
        function ready(){
            if(readyCount <= 0){
                callback && callback();
            }
        };
        ready();
    }else{
        callback && callback();
    }
};

// define 使用 的 require
// 内置的 require，需要修复一次路径
function createInnerRequire(url){
    var dir = path.dir(url);
    return function innerRequire(url, callback){
        // 名字 或 绝对路径
        var absoluteUrl = concatFilePath(url, dir);
        var cnt = loaded[url] || loaded[absoluteUrl];
        // 当前内容，是否已经存在
        if(cnt || absoluteUrl in loaded){
            callback && callback(cnt || loaded[absoluteUrl]);
            return cnt.exports;
        }else{
            loader.require(absoluteUrl, callback);
        }
    };
};

// 合并文件路径
// 让 文件 路径，支持模板计算方法
var pathFormat = Format(data);
function concatFilePath(url, dir){
    // 路径模版化
    url = pathFormat(url);
    if(path.isAbsolute(url)){
        return url;
    }else{
        return path.join(dir || basePath, url);
    }
};

window.require = loader.require;
window.define = loader.define;
window.require.addTypeProcesser = loader.addTypeProcesser;
window.require.ajax = ajax;
