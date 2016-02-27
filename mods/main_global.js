// 注释的正则，含多行与单行注释
var REQUIRE_REGEXP = /[^.]require\(["']([^'"]+)["']\)/g;

// require 路径解析时，使用的模板数据
var requireTemplateData = {  };
// require 寻址基础路径
var requireBasePath;
// 已加载完成的模块
var requireLoadedModule = {  };
// require 中，设置的module依赖别名
var requireModuleAlias = {  };
// 模块状态
var FINISH = 1, LOADING = 0;
// require 额外拓展的功能
var requireExtension = {};

// 当require加载板块时，如果新板块有 define 函数，则会把 define 的结构，记录在这里
var defineResult;
// 怪异的 define 模式，在此模式下，js加载完成后，并不会立刻运行
var isScriptExecuteDelayMode = !!winDocument.attachEvent;
