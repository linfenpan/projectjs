define(function(require, exports, module){
    console.log("进入了sea1");
    console.log(require("./sea3.js"));

    require("./sea2.js", function(data){
        console.log("在sea1中，找到了sea2：", data);
    });
});
