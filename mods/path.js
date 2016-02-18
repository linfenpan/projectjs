// 路径解析
function removeUrlSeachAndHash(uri){
    return uri.replace(/(\?|#).*$/, "");
};
var path = {
    // 路径格式化
    normal: function(uri){
        // 1. ./a/./b//c/d/../e/ ==> ./a//b//c/d/../e/
        // 2. ./a//b/c/d/../e/ ==> ./a/b/c/d/../e/
        // 3. ./a/b/c/d/../e/ ==> ./a/b/c/e/
        return uri.replace(/\/\.\//g, "\/\/").replace(/([^:])\/{2,}/g, "$1\/").replace(/[^/]+\/\.\.\/([^/]*)/g, "$1");
    },
    // 是否绝对路径, ftp:// 或 http:// ，不过 // 这种不知道算不算呢?
    isAbsolute: function(uri){
        return /:\/\//.test(uri);
    },
    // 路径合并
    join: function(){
        return path.normal([].join.call(arguments, "\/"));
    },
    // 目录，http://www.100bt.com 这样的，会有BUG，现实不存在这样的路径，先无视
    //  删除 search 和 hash 部分
    dir: function(uri){
        return removeUrlSeachAndHash(uri).replace(/(.*\/).*$/, "$1");
    },
    // 后缀名
    ext: function(uri){
        return removeUrlSeachAndHash(uri).replace(/.*\.(.*)$/, "$1");
    }
};
