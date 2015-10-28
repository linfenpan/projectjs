module.exports = function(PM){
    PM.addPlugins(require("./copy"));
    PM.addPlugins(require("./minifyjs"));
    PM.addPlugins(require("./minifycss"));
    PM.addPlugins(require("./minifyhtml"));
};
