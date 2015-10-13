var data = {basePath: null}; // 模板数据, basePath: "/"
var loaded = {};            // 加载完成的脚本
var basePath = "";

// 异步对象
function queryDeferred(url){
    if(loaded[url]){
        return loaded[url].def;
    }else{
        var def = new Callbacks({done: [1, "resolve"], always: 0}, true);
        loaded[url] = def;
        def.exports = null;
        def.done(function(res){
            def.exports = res;
        });
        return def;
    }
};

// 项目设置
if(window.Project){
    extend(data, window.Project.path || {});
    // 修正外部引用
    var other = window.Project.other;
    if(other){
        each(other, function(i, val){
            var def = queryDeferred(i);
            def.resolve(other[i]);
        });
    };
};

// 计算基础路径
;(function(doc){
    var node = null;
    if(data.basePath){
        basePath = data.basePath;
        if(!path.isAbsolute(basePath)){
            node = doc.createElement("a");
            node.setAttribute("href", basePath);
            // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
            basePath = path.dir(node.hasAttribute ? node.href : node.getAttribute("href", 4));
        }
    }else{
        node = doc.getElementById("projectnode") || doc.scripts[0];
        var i = 0;
        while(i++, !node.src){
            node = doc.scripts[i];
        }
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        basePath = path.dir(node.hasAttribute ? node.src : node.getAttribute("src", 4));
    };
    data.basePath = basePath;
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

// 仅且加载一个
function requireOne(url, callback){
    url = concatFilePath(url);
    if(loaded[url] || url in loaded){
        loaded[url].done(function(exports){
            isFunction(callback) && callback(exports);
        });
        return loaded[url].exports;
    }else{
        // 获取 def 对象
        var def = queryDeferred(url);
        // 开始加载
        var ext = path.ext(url);
        var fn = requireMap[ext] || requireMap["default"];
        fn(url, function(res, isFromScript){
            if(isFromScript){
                res = defineRes;
                defineRes = null;
                if(isFunction(res)){
                    if(res.length == 3){
                        // 预先加载
                        parseBeforeExecute(path.dir(url), res, function(fn){
                            if(isFunction(res)){
                                var module = {exports: {}};
                                res(createInnerRequire(url), module.exports, module);
                                res = module.exports;
                            }
                            next(res);
                        });
                    }else{
                        // 内置字符串
                        next(queryFnInnerText(res));
                    }
                }else{
                    next(res);
                }
            }else{
                next(res);
            }
        }, ext);
        // 处理完毕
        function next(res){
            def.resolve(res);
            isFunction(callback) && callback(res);
        };
    }
};

// 加载器
var loader = {};

// 文件加载，可加载多个
// require("文件1", "文件2", 回调);
loader.require = function(){
    // require("1.js", "2.js", 回调);
    var args = [].slice.call(arguments, 0), list = args.slice(0, -1), fn = args[args.length - 1];
    if(queryType(fn) === "string"){
        list.push(fn);
        fn = noop;
    };

    var loadCount = 0, res = [], afterFor = false;
    each(list, function(index, url){
        loadCount++;
        requireOne(url, function(data){
            loadCount--;
            res[index] = data;
            // 执行下一步
            next();
        });
    });
    afterFor = true;
    function next(){
        // 用了一次 父级 作用域
        if(afterFor && loadCount <= 0){
            fn.apply(this, res);
        };
    };
    next();
};

// 脚本如果调用了 define
var defineRes = null;
loader.define = function(name, fn){
    var len = arguments.length;
    if(len == 1){
        defineRes = name;
    }else{
        var def = queryDeferred(name);
        def.resolve(fn);
    };
};

// 添加文件 处理器
loader.addTypeProcesser = function(type, fn){
    requireMap[type] = isFunction(fn) ? fn : (requireMap[fn] || requireMap["default"]);
};

// 文件执行前，对路径进行预解析
function parseBeforeExecute(dir, fn, callback){
    if(isFunction(fn)){
        // 把注视删除
        var str = fn.toString().replace(/\/\*(.|\n|\s)*\*\/|\/\/[^\n\r]*/g, "");
        // 检测的正则
        var reg = /\brequire\s*\(([^)]*)\)/g;
        var res, readyCount = 0, afterCompile = false;
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
        afterCompile = true;
        function ready(){
            if(readyCount <= 0 && afterCompile){
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
    function innerRequire(url, callback){
        // 名字 或 绝对路径
        var absoluteUrl = concatFilePath(url, dir), args = arguments;
        return args.length <= 1 ? requireOne(absoluteUrl, callback) : innerRequire.async.apply(this, args);
    };
    // 链接
    innerRequire.url = function(url){
        return concatFilePath(url, dir);
    };
    // 异步请求
    innerRequire.async = function(){
        // 修正一次路径
        // 然后调用 loader.require
        var args = [].slice.call(arguments, 0), item;
        for(var i = 0, max = args.length; i < max; i++){
            item = args[i];
            typeof item === "string" && (args[i] = concatFilePath(item, dir));
        };
        loader.require.apply(loader, args);
    };
    return innerRequire;
};

// 合并文件路径
// 让 文件 路径，支持模板计算方法
var pathFormat = Format(data);
function concatFilePath(url, dir){
    if(loaded[url]){
        return url;
    };
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
