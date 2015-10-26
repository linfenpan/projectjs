var utils = {
    // 简单的模板方法
    format: function(data){
        var str = "";
        for(var i in data){
            str += "var " + i + " = \"" + data[i].toString().replace(/(")/g, "\$1") + "\";\n"
        };
        str += 'return str.replace(/\\${([^}]*)}/g, function(str, key){\nreturn eval(key) || "";\n});\n';
        return new Function("str", str);
    },
    // 是否绝对路径
    isAbsolute: function(r){
        return /:\/\//.test(r);
    },
    // 去除注释
    removeNotes: function(str){
        return str.replace(/\/\*(.|\n|\s)*?\*\/|\/\/[^\n\r]*/g, "");
    }
};

module.exports = utils;
