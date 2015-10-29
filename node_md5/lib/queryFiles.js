"use strict";

var fs = require("fs-extra");
var util = require("util");
var path = require("path");
var matcher = require("./matcher");

var searcher = {};

/**
 * @param list {String | Array} 需要寻找的文件列表 | 文件
 * @param cwd {String} 需要开始寻找的目录，必须是目录
 */
searcher.find = function(list, cwd){
    if(!util.isArray(list)){
        list = [list || "*"];
    }
    cwd = cwd || process.cwd();
    var res = [];

    list.forEach(function(str){
        var isNotMode = false;
        if(typeof str === "string"){
            isNotMode = str.indexOf("!") === 0;
            if(isNotMode){
                str = str.slice(1);
            }
        }
        var query = normalizeQueryPath(str, cwd);

        // 判断是否取反，取反，则从当前选中数组中，删除元素
        // 反之，则添加进 res
        if(isNotMode){
            let _str = query.glob, _cwd = query.cwd;
            res = res.filter(function(file){
                return !isMatch(_str, file, _cwd);
            });
        }else{
            res.push.apply(res, searchFile(query.glob, query.cwd));
        }
    });

    return res;
};

/**
 * 初始化搜索的 glob 表达式
 * @param str {String | RegExp} glob 表达式或正则
 * @param cwd {String} 搜索的目录
 * @return {glob: String, cwd: String}
 */
function normalizeQueryPath(str, cwd){
    cwd = cwd || process.cwd();

    if(!util.isRegExp(str)){
        // ./xxx/yyy/*.js ---> xxx/yyy/*.js
        // ../xxx/yyy/*.js ---> ../xxx/yyy/*.js
        str = path.normalize(str);

        // ./xxx/*.js --> 直接匹配
        // ../xxx/yyy/*/*.js --> 处理后，匹配
        if(/^\.\./.test(str)){
            // 把 ../xxx/*.js ---> rel = "../"; str = "xxx/*.js"
            let rel = new Array(str.match(/\.\./g).length + 1).join("../");
            cwd = path.join(cwd, rel);
            str = str.replace(/\.\.[\/\\]/g, "");

        }

        // ../src/*.js 这种操作，太过昂贵了，给 cwd 尽量多的目录吧
        // 那样子，匹配的时候，就更少目录会被查询了
        let reg = /^([^*?.\(\)\[\]{}]+?)[\/\\]/g;
        while(reg.test(str)){
            str = str.replace(reg, function(s, p){
                cwd = path.join(cwd, p);
                return "";
            });
        }
    }
    return {glob: str, cwd: cwd};
};

/**
 * 根据路径和glob表达式，搜索文件
 * @param str {String | RegExp} glob表达式或正则
 * @param dir {String} 当前搜索目录
 * @param cwd {String} 搜索的根目录，如果为 null，则等于 dir
 * @return [文件列表]
 */
function searchFile(str, dir, cwd){
    cwd = cwd || dir;
    if(!fs.existsSync(dir)){
        return [];
    }
    var list = fs.readdirSync(dir), res = [];

    list.forEach(function(url){
        var absUrl = path.resolve(dir, url);
        // 目录再深入遍历
        // 文件，则进行匹配判断
        if(fs.statSync(absUrl).isDirectory()){
            res.push.apply(res, searchFile(str, absUrl, cwd));
        }else{
            if(isMatch(str, absUrl, cwd)){
                res.push(absUrl);
            }
        }
    });

    return res;
};

/**
 * 判断 url 是否 满足 str {golb} 的条件
 * @param str {String | 正则}
 * @param url {String} 需要匹配的绝对路径
 * @param cwd {String} 匹配的上下文路径
 */
function isMatch(str, url, cwd){
    // 因为绝对路径，./script/*.js  -- 将会匹配 --> ./script/*.js 和 ./dest/script/*.js
    // 使用相对路径，避免这个尴尬
    var rel = path.relative(cwd, url);
    return matcher(rel, str);
};
searcher.isMatch = isMatch;

module.exports = searcher;
