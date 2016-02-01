# 初衷

项目地址: [projectM](https://github.com/linfenpan/projectM)

无论require.js还是sea.js，都并不完全满足日常的项目开发，为此，模仿编写了此项目。
如要使用或测试，请用最新版

功能介绍:

	1. require 进行模块加载
	2. define 进行模块定义
	3. require.ajax 在简单项目中，替代zepto的$.ajax
	4. require.css 进行样式加载
	5. require.loadScript 进行脚本加载

注:  require 作为关键字，不可被压缩、更改名字


# 简单用例

引入 project.js，项目的基本路径，默认是当前网址的目录。
如页面地址为: http://www.test.com/xxx/index.html
那项目路径，则是: http://www.test.com/xxx/

``` html
<script src="project.js" id="seedNode"></script>
<script>
	require("./script/user.js", function(user){
      console.log("获取到用户信息", user);	// ==> {name: "", email: ""}
   });
</script>
```

而对于 user.js 的定义:

``` javascript
// 不完全遵循 cmd 规范，最多接受两个参数，1、板块名字[可缺省] 2、函数
define(function(require, exports, module){
	exports.name = "da宗熊";
	exports.email = "xxx@qq.com";
});
```

# define

用于定义模块，其使用遵循此格式:  define([moduleName,] content);
其中，moduleName 可忽略。
如:
``` javascript
define(function(require, exports, module){
	/** 其中，如果用不到exports和module，在声明中可去掉 **/
});
// or
define("也可以是非function的任意内容");
```
moduleName的默认值，将会是此脚本的路径。

在 define 中，用到的require函数，将会基于当前 脚本目录 进行寻址。
有 http://www.test.com/script/test.js
``` javascript
define(function(require){
	var data1 = require("./data.js");    // 将会同步加载 http://www.test.com/script/data.js
	require("./data2.js", function(){ /* data2.js 会异步加载 */ });
});
```

如显式指定了 moduleName，而第二参数是函数，那么，也会进行模块加载，如:
``` javascript
define("moduleA", function(require){
	var user = require("./user.js");   // 根据当前文件所在位置，获取到 user.js
});
```

如果 define 写在页面的内联脚本中，其中的 require 寻址路径，与初始[配置]寻址路径保持一致。
``` html
<div> http://www.test.com/index.html </div>
<script src="./lib/project.js"></script>
<script>
	define("moduleA", function(require){
		console.log(require("authorText.js"));
	});
	require("moduleA");
</script>
```
这里的 require("authorText.js") 对应 http://www.test.com/authorText.js 。

如果，有配置路径:
``` html
<script>
	require.config({ basePath: "script" });
</script>
```
则  require("authorText.js")  对应是 http://www.test.com/script/authorText.js


# require

用于加载一个或多个模块。用法如下: require(module1, [module2, module3, ...], callback?);
其中，callback 可以省略。

require 默认都是异步加载的，仅且一种情况下，require可“当作”同步加载使用:
``` javascript
define(function(require){
	var user = require("user.js");   // 此行代码，将会同步返回 user.js 的内容
});
```
如果 require 超过1个参数，则是异步调用。

在 require 中，有几个实用的工具方法:

	1. require.css("./data.css"); 根据当前模块路径，加载相关样式，做了简单的防重复加载
	2. require.url("./data.json"); 根据模块路径，返回文件路径




# 寻址路径

项目路径，默认是当前访问地址的根目录。可通过设置 id="seedNode"，来指定根据 project.js 所在目录作为基础路径。
``` html
<script src="http://www.test.com/js/project.min.js" id="seedNode"></script>
```
板块的初始加载路径，将会是:  http://www.test.com/js/

也可以通过配置，进行配置：
``` javascript
require.config({ basePath: "http://www.test.com/script/" });
```
如果 basePath 是相对路径，则:

	1. 不存在 seedNode ⇒ 页面访问路径 + 相对路径 = 初始加载路径
	2. 存在 seedNode ⇒ project.js所在的目录 + 相对路径 = 初始加载路径


# 模板

通过  require.config({ template: {} }); 配置路径模板，如:

``` javascript
require.config({
	template: {
		stat: "./wap/stat.js"
	}
});

require("{stat}");  // 将加载 ./wap/stat.js
```
主要针对脚本打指纹之后的寻址。


# 别名

通过 require.config({  alias: {} }); 进行别名制定，特别针对非模块化的脚本，会特别有用，如:

```
require.config({
	alias: {
		"jquery": window.jQuery
	}
});

require("jquery", function($){
	// $ -> window.jQuery
});
```


# 结语

持续优化中，如有BUG，联系 [da宗熊]  1071093121@qq.com
