"use strict";
var fs = require("fs-extra"), path = require("path"), matcher = require("./matcher");
var root = path.join(__dirname, "../");

var Dir = {
    root: function(r){
        if(r){
            root = r;
        }else{
            return root;
        }
    },
    each: function(match, dir, cwd){
        // 遍历 match 指定文件夹
        dir = dir || root, match = match || "*.*";
        cwd = cwd || dir;

        var list = fs.readdirSync(dir), res = [];
        list.forEach(function(absUrl){
            absUrl = path.resolve(dir, absUrl);
            if(this.isdir(absUrl)){
                // 目录再深入遍历
                res.push.apply(res, this.each(match, absUrl, cwd));
            }else{
                // 因为绝对路径，./script/*.js  -- 将会匹配 --> ./script/*.js 和 ./dest/script/*.js
                // 使用相对路径，避免这个尴尬
                let rel = path.relative(cwd, absUrl);
                if(matcher(rel, match)){
                    res.push(absUrl);
                }
            }
        }.bind(this));
        return res;
    },
    isdir: function(url){
        // 是目录否?
        return fs.existsSync(url) ? fs.statSync(url).isDirectory() : false;
    },
    // 拷贝文件列表
    copyFiles: function(list, from, to){

    }
};


module.exports = Dir;
