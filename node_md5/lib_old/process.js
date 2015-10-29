"use strict";
// 对脚本、html、css进行加工
var uglify = require("uglify-js");
var CleanCSS = require('clean-css');
var htmlMinify = require("html-minifier");
var fs = require("fs-extra");

var proc = {
    js: function(url){
        return uglify.minify(url, {
            mangle: {
                except: "require"
            }
        }).code;
    },
    css: function(url){
        // 把所有 注释、换行删除
        return new CleanCSS().minify(fs.readFileSync(url)).styles;
    },
    html: function(url){
        // 删除注释、换行，压缩脚本、样式
        return htmlMinify.minify(fs.readFileSync(url).toString(), {
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: {
                mangle: {
                    except: "require"
                }
            },
            minifyCSS: true
        });
    },
    md5: function(text){

    }
};


module.exports = proc;
