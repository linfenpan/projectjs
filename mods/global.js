var winDocument = window.document;
var eHead = winDocument.head || winDocument.getElementsByTagName("head")[0] || winDocument.documentElement;

var EMPTY = null;
var internalToString = Object.prototype.toString;
var internalSlice = [].slice;

var COMMENT_REGEXP = /("([^\\\"]|\\.)*")|('([^\\\']|\\.)*')|(\/{2,}.*?(\r|\n))|(\/\*(\n|.)*?\*\/)/g;

// @NOTICES: 考虑到代码压缩之后，eval里的"o."就没效了..没想到更好的，有大神指导不?
var template = Function("s", "o", "return s.replace(/{([^}]*)}/g,function(a,k){return eval('o.'+k)})");

function noop(){ /* 占位用的空函数 */ }

function queryType(obj){
    return internalToString.call(obj).split(" ")[1].toLowerCase().slice(0, -1);
};

function isFunction(obj){
    return queryType(obj) === "function";
};

function createElement(elem){
    return winDocument.createElement(elem);
}

function each(obj, callback){
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            callback && callback(obj[i], i, obj);
        }
    }
};

function combine(){
    var args = arguments;
    var source = args[0];
    args = internalSlice.call(args, 0);

    each(args, function(target){
        each(target, function(value, key){
            var type = queryType(value);
            switch (type) {
                case "object":
                    source[key] = {};
                    combine(source[key], value);
                    break;
                case "array":
                    source[key] = [];
                    combine(source[key], value);
                    break;
                default:
                    source[key] = value;
            }
        });
    });

    return source;
};

function trim(str){
    return str.replace(/^\s*|\s*$/g, "");
};

// 绝对路径
function isAbsolute(url){
    return path.isAbsolute(url);
};

function removeComment(str){
    return str.replace(COMMENT_REGEXP, function(word) {
        return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? "" : word;
    });
};
