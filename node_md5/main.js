"use strict";

var path = require("path");
var matcher = require("./lib/matcher");
var dir = require("./lib/dir");
var Signal = require("./lib/Signal");

// 查询对象类型
var toString = Object.prototype.toString;
var queryType = function(o){
    return toString.call(o).toLowerCase().split(" ")[1].slice(0, -1);
};
// 对象合并
function extend(){
    var args = [].slice.call(arguments, 0), obj1 = args.shift();
    args.forEach(function(obj){
        for(var i in obj){
            if(obj.hasOwnProperty(i)){
                obj1[i] = obj[i];
            }
        }
    });
    return obj1;
}

// 一个全局对象，进行管理
function PM(){};
PM.prototype = {
    init: function(cf){
        var options = this.options = cf || {cwd: "./src"};
        options.cwd = path.join(global.process.cwd(), options.cwd);
        // 任务列表
        this._task = {};
        // 一系列的任务
        this._taskList = {};

        this.init = function(){};
        return this;
    },
    // 启动任务，不去重复~
    // start("copy") 启动 copy 下的所有任务
    // start(["copy:mm", "copy:xx"]) 或 start("copy:mm", "copy:xx"): 启动　copy 下的mm 和 xx 任务
    run: function(fn){
        var list = fn;
        if(queryType(list) == "string"){
            list = [].slice.call(arguments, 0);
        }
        list.forEach(function(name){
            var arr = name.split(":");
            this.log.info("********** start task: " + name);
            if(arr.length == 1){
                let tasks = this._task[name];
                if(tasks){
                    for(var i in tasks){
                        if(tasks.hasOwnProperty(i)){
                            let fns = tasks[i];
                            fns.forEach(function(fn){
                                fn();
                            });
                        }
                    }
                }else{
                    this.log.error("task [" + name + "] does not exist");
                }
            }else{
                var fns = this._task[arr[0]][arr[1] || "default"];
                if(fns){
                    fns.forEach(function(fn){
                        fn();
                    });
                }else{
                    this.log.error("task [" + name + "] does not exist");
                }
            }
            this.log.info("********** end task: " + name + "\n\n");
        }.bind(this));
    },
    // 执行一组任务
    runGroup: function(name){
        var map = this._task;
        name = name || "default";

        for(let i in map){
            let item = map[i], list = item[name];
            if(list){
                this.log.info("********** running group: " + name + "-->" + i);
                list.forEach(function(fn){
                    fn();
                }.bind(this));
                this.log.info("********** end of group: " + name + "-->" + i + "\n\n");
            }
        }
    },
    // 设置任务
    setTask: function(name, list){
        this._taskList[name] = queryType(list) === "string" ? [list] : list;
    },
    // 执行任务
    runTask: function(name){
        var list = this._taskList[name];
        if(!list){
            this.log.error("task ["+ name +"] does not exist");
            return;
        }
        list.forEach(function(task){
            this.run(task);
        }.bind(this));
    },
    // 添加插件
    addPlugins: function(fn){
        fn.call(this, this);
        return this;
    },
    // 设置插件
    // plugins 必须 exports = function，此function的this，是当前对象，可通过 add 方法，添加真正的插件
    setPlugins: function(name, fn){
        // 插件添加后，进行加工，放入 _task[插件名] 的数组中
        // 调用 strt("插件名") 后，才真正的执行
        // @params {Object} 参数
        // @param {String} 任务组
        this[name] = function(params, anotherName){
            // {copy: {default: [], other: []}}
            // 计算保存的列表
            var tasks = this._task[name];
            if(!tasks){
                tasks = this._task[name] = {"default": []};
            }
            // 默认保存在 default 数组中
            anotherName = anotherName || "default";
            if(!tasks[anotherName]){
                tasks[anotherName] = [];
            }
            tasks = tasks[anotherName];

            // params 几种情况
            //  array: 返回 null, [文件列表], 参数
            //  string: 返回 null, [文件列表], 参数
            //  对象:   返回 {path:, isFile:}, [文件列表], 参数
            var type = queryType(params), obj;
            switch(type){
                case "array":
                    obj = {
                        files: params
                    };
                    break;
                case "string":
                    obj = {
                        files: [params]
                    };
                    break;
                case "object":
                    obj = params;
                    break;
                default:
                    obj = {};
            }

            // obj => {options: {}, files: [], "xxxx": "yyyy"}
            var options = extend({cwd: this.options.cwd, taskName: anotherName ? `${name}:${anotherName}` : `${name}`}, obj.options || {}), list = obj.files;
            delete obj.options;
            delete obj.files;

            if(list){
                let resList = list;
                tasks.push(function(){
                    console.log(2222, resList);
                    fn.call(this, null, this.filter(resList), options);
                }.bind(this));
            }else{
                for(let i in obj){
                    tasks.push(function(){
                        fn.call(this, {path: i, isFile: /[^\/\\]+\.[^.]+$/.test(i)}, this.filter(obj[i]), options);
                    }.bind(this));
                }
            };
            return this;
        }
        return this;
    },
    // 列表过滤
    filter: function(str, cwd){
        var res = [];
        cwd = cwd || this.options.cwd;

        if(typeof str == "string"){
            str = [str];
        };
        str.forEach(function(str){
            var isString = typeof str == "string", isNotMode = false;
            if(isString){
                isNotMode = str.indexOf("!") == 0;
                str = str.replace(/^!/, "");
            }
            str = path.normalize(str);

            // 否则，是新增
            var reg = matcher.parse(str);
            // 如果是以 ! 开头的字符串，则是删除操作
            if(isNotMode){
                res = res.filter(function(file){
                    var rel = path.relative(cwd, file);
                    return !reg.test(rel);
                });
            }else{
                res.push.apply(res, this.queryFiles(str, cwd));
            }
        }.bind(this));

        return res;
    },
    // 根据当前 cwd，查询对应的文件
    queryFiles: function(str, cwd){
        cwd = cwd || this.options.cwd;
        // ./xxx/yyy/*.js ---> xxx/yyy/*.js
        // ../xxx/yyy/*.js ---> ../xxx/yyy/*.js
        str = path.normalize(str);

        // ./xxx/*.js --> 直接匹配
        // ../xxx/yyy/*/*.js --> 处理后，匹配
        if(/^\.\./.test(str)){
            // 把 ../xxx/*.js ---> rel = "../"; str = "xxx/*.js"
            let rel = new Array(str.match(/\.\./g).length + 1).join("/");
            cwd = path.join(cwd, rel);
            str = str.replace(/\.\.[\/\\]/g, "");
        }
        return dir.each(str, cwd);
    },
    fs: require("fs-extra"),
    // 打印的样式
    log: require("./lib/colors")
};


// 外部接口
function Out(){
    if(this instanceof Out){
        var p = new PM();
        p.addPlugins(require("./plugins/innerPlugins"));
        return p;
    }
    return Out;
};
if(true){
    let obj = new PM();
    obj.addPlugins(require("./plugins/innerPlugins"));
    for(let i in obj){
        Out[i] = obj[i];
    }
};
module.exports = Out;


// var realPath = path.relative(path.resolve("./"), "./test/demo.html");
// console.log(matcher(realPath, "*.(html|js)", {matchLast: true}));

// 给所有文件 压缩、打上 md5
// var proc = require("./lib/process");
// console.log(proc.js(path.resolve("./test/script/data.js")));
// console.log(proc.css(path.resolve("./test/css/user.css")));
// console.log(proc.html(path.resolve("./test/demo.html")));

// var minimatch = require("minimatch");
//
// console.log(minimatch("bar.foo", "*.foo"));
// console.log(minimatch("./aa/bbb.txt", "*.{txt,png}", {matchBase: true}))
// console.log(minimatch("./aa/bbb.txt", ".*", {matchBase: true}))
// console.log(minimatch("./aa/bbb.txt", "./**/*.+(txt|png)"))
