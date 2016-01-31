define(function(require, exports){
    exports.async = function(callback){
        require("./data6.test.js", function(pass){
            callback(pass);
        });
    };
});
