# 初衷

项目地址: [projectM](https://github.com/linfenpan/projectM)

测试地址: [demo](http://linfenpan.github.io/demo/project/)

测试请使用最新版本~

因流行的模块加载器，或用法不够简单、大小超出预期等原因，不能很好的满足日常开发，为此，模仿编写了此项目。
如要使用或测试，请用最新版

功能介绍:

	1. require 进行模块加载
	2. define 进行模块定义
	3. require.loadScript 进行脚本加载

注1:  require 作为关键字，不可被压缩、更改名字

可能有个疑惑，既然已经有require.js和sea.js，还需要这玩意干嘛呢？

	1. 体积更小
	2. 更少潜规则
	3. 更直白的配置
	4. 更少的关键字，尽可能保证各处使用的一致性
	5. 以后缀区分文件类型，可自定义后缀载入方式，扩展更丰富的功能
	6. 同样兼容PC[包括IE]和移动端

缺点也有:

	1. 没有完善脚本的打包规则
	2. 仅且适用于浏览器，其余的设备，因木有接触，不做更多兼容
	3. 团队各种奇怪的玩法，表示节操君已经掉了一地
	4. 维护团队么...... [只有一头熊


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
	/** 其中，如果用不到require、exports、module，在声明中可去掉 **/
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


也可以通过第3个参数[必须是3个参数]，设置 define 中的寻址路径，用于应对异步 define 之类的需求。
异步设置 define，默认的寻址路径，都是 项目的寻址路径。
``` javascript
define("moduleA", function(require){
	// require 寻址文件，将从 http://www.test.com/ 开始寻找
}, "http://www.test.com/");
```
注意: 第3个参数，如果是 "//"，则代表当前项目的初始寻址路径。


# require

用于加载一个或多个模块。用法如下: require(module1, [module2, module3, ...], callback?);
其中，callback 可以省略。

require 默认都是异步加载的，仅且一种情况下，require可“当作”同步加载使用:
``` javascript
define(function(require){
	// 此行代码，将会同步返回 user.js 中，设置的 exports 的内容
	// 实际上，在运行 define(function(){}) 时，user.js的代码，就已经被运行了
	var user = require("user.js");
});
```
如果 require 最后，跟着callback，模块将会异步加载。

见如下代码:
``` javascript
<script>
require("./user.js", function(user){
	// 肯定能获取到 user 对象
});

// 尝试去获取 user.js，如果在调用这句函数前，user.js幸运的被加载过，这里，会成功返回user对象，否则是 undefined
var user = require("./user.js");

// 换一种形式，也是可以获取到的
require("./user.js", function(){
	// 因为在运行此行前，已经保证 user.js 加载过了，下面能毫无压力的使用
	var user = require("./user.js");
});
</script>
```

在 require 中，有几个实用的工具方法:

	1. require.url("./data.json"); 根据模块路径，返回文件路径
	2. require.loadScript(url); 加载脚本
	3. require.addExtension("拓展名字", "拓展内容"); 给 window.require 和 define 的 require，同时增加方法

同时，也可在 require.loader 中，对后缀进行拓展:

``` javascript
require.loader.add("txt", function(url, callback){
	$.get(url, function(text){
		callback("加载文件:" + text);
	});
});

require("./test.txt", function(text){
	// text === "加载文件:xxxxx";
});
```
所有loader，可通过"!"注释，表明该文件的正确加载方式，如:
``` javascript
require("./test.html!js", $.noop);
```
``` test.html ``` 将会以 js 形式，进行加载。
注：默认的loader，只有 js，在 full 版中，有 js、css、ajax、json 4个loader。

也可以通过 ``` require.loader.setDefault("ajax") ``` 来更改默认的 loader，路径的后缀名，如果不存在于 loader列表，则会使用默认的 loader，进行加载


# 寻址路径

寻址路径，默认是当前访问地址的根目录。可通过设置 id="seedNode"，来指定根据 project.js 所在目录作为基础路径。
``` html
<script src="http://www.test.com/js/project.min.js" id="seedNode"></script>
```
板块的寻址路径，将会是:  http://www.test.com/js/

也可以通过配置，进行配置：
``` javascript
require.config({ basePath: "http://www.test.com/script/" });
```
如果 basePath 是绝对路径，则使用 basePath 作为 寻址路径。
如果 basePath 是相对路径，则:

	1. 不存在 seedNode ⇒ 页面访问路径 + 相对路径 = 寻址路径
	2. 存在 seedNode ⇒ project.js所在的目录 + 相对路径 = 寻址路径


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


# FULL版

full版，相对与普通版本，额外增加了 3 个 loader：

	1. ajax loader，可进行ajax请求
    2. json loader，可进行ajax请求，并将内容转为 json [基于 ajax loader 开发]
    3. css loader，可进行css加载

同时，拓展了 require 两个方法:

	1. require.ajax，可用于 ajax 请求
    2. require.css，可用于 css 加载

注: 两个方法，通过 require.addExtension("xxx", func); 的形式，进行注入


# 注意事项

1、不能异步使用 define 函数，如:
``` javascript
$(function(){
	// 因为 dom ready 有一定的时差
	define("main", function(require){
		// require 的寻址路径，可能会混乱【不一定会发生
	});
});
```

2、css loader，link标签，是append到 head 元素中。

	重写css loader加载进来的样式时，需要注意

3、define("moduleA", fn);

# 结语

持续优化中，如有BUG，联系 [da宗熊]  1071093121@qq.com
