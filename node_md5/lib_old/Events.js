"use strict";
var events = require("events");
var G = new events.EventEmitter();
// 事件列表
var E = [

];
E.forEach(function(e){
    G[e] = e;
});
module.exports = G;
