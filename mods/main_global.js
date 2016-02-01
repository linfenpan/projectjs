// 注释的正则，含多行与单行注释
var COMMENT_REGEXP = /\/\*(.|\n|\s)*?\*\/|\/\/[^\n\r]*/g;
var REQUIRE_REGEXP = /[^.]require\(["']([^'"]+)["']\)/g;

// require 路径解析时，使用的模板数据
var requireTemplateData = {  };
// require 寻址基础路径
var requireBasePath = null;
// 已加载完成的模块
var requireLoadedModule = {  };
// require 中，设置的module依赖别名
var requireModuleAlias = {  };
// require 中，最近加载的链接
var requireRecentLoadUrl = null;
// 模块状态
var FINISH = 1, LOADING = 0;

// 当require加载板块时，如果新板块有 define 函数，则会把 define 的结构，记录在这里
var defineResult = null;
// 怪异的 define 模式，在此模式下，js加载完成后，并不会立刻运行
var isScriptExecuteDelayMode = !!winDocument.attachEvent;
