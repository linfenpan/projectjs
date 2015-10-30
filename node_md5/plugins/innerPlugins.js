module.exports = function(PM){
    PM.addPlugins(require("./copy"));
    PM.addPlugins(require("./clean"));
    PM.addPlugins(require("./minifyjs"));
    PM.addPlugins(require("./minifycss"));
    PM.addPlugins(require("./minifyhtml"));

    // 内置打包测试
    PM.addPlugins(require("./pmd5"));
};
