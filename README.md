# 功能简要说明

项目地址: [projectM](https://github.com/linfenpan/projectM)

模仿sea.js编写的脚本，只有 require 和 define 两个方法。
考虑到 sea.js 本身的 require，并不能加载样式、外部html结构等，所以，在此进行了改进，并提供了相关的解决方案。

并不完全遵循 cmd 规范，为了满足 **跨域** 读取资源的需求，定义了额外的define规则。

PS: require 作为关键字，同样不可以被改名，被压缩


# 简单用例

引入 project.js，项目的基本路径，默认是第1个有src的脚本的路径，所以，最好把 project.js 置于第1个脚本。

``` html
<script src="project.js" id="projectnode"></script>
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

# define的使用

1、板块定义

``` javascript
define(function(require, exports, module){
	// 后缀的 .js 不能省略
	var data = require("../data/data.js");
	module.exports = {/*外部可见的内容*/}
});
```

2、可指定名字

``` javascript
define("user", function(require, exports, module){
	// 内容定义...
});
```
外部可 require("user") 使用，不用填充路径

3、加载同域内容

``` javascript
define(function(require, exports, module){
	var css = require("./user.css");	// 作为文本，被加载进来
});
```

4、定义其它内容

``` javascript
define({name: "", email: ""});
// 或
define("xxxyyy");
// 或
define(true);
```

5、加载任意内容

``` javascript
// function 内，必须没有require等参数
define("text", function(){
/*!
	这里的内容，会被返回咧~~，最前面的 ! 不能省略，如果参数小于3，则会把这里的所有内容返回
	特别用于加载 html、css 或 多行文字 的内容，最合适不过了
*/
});
```
外部使用:
``` javascript
require("text", function(text){
	text === "这里的内容，会被.......";
});
```

6、获取绝对路径

``` javascript
define(function(require, exports, module){
	var url = require.url("./data.json");   // 获取的是，data.json的绝对路径
});
```

7、define中异步加载

``` javascript
define(function(require, exports, module){
	// 仅且只能异步加载 1 个内容
	require("./data.json", function(data){
   		// 这里是异步执行的内容 
   	});
   // 或者，通过 async 加载多个内容
   require.async("./data.json", "./user.js", function(data, user){
		// 异步执行的内容
	});
});
```

# require 的使用

在 define 中的 require 和 在 window 下的 require，是不一样的。在window下的require，只有1个作用，异步加载内容【或者说，作为程序的入口】

1、window下

``` javascript
require("./data.js");   // OK
require("./data.js", function(data){});   // OK
require("./data1.js", "./data2.js");   // OK
require("./data1.js", "./data2.js", function(data1, data2){}); // OK
```
但是

``` javascript
require.url("./data.js"); // ERROR
require.async("./data.js"); // ERROR
```

2、define下

``` javascript
define(function(require, exports, module){
	var data = require("./data.js");   // OK
	require("./data.js", function(data){});   // OK，异步执行 fn，注: 如果 ./data.js 已加载，则会同步执行
	
	// 不支持用法:
	require("./data1.js", "./data2.js");   // ERROR，不会报错
	require("./data1.js", "./data2.js", function(data1, data2){}); // ERROR，不会报错
});
```

但有一些用法是错的，绝对不允许使用:

``` javascript
define(function(require, exports, module){
	var data1 = require("./data1.js", "./data2.js");   // data1 = undefined 或 正常取值
	require("./data1.js", "./data2.js", function(data1, data2){}); // 不会执行callback
});
```

代替上面两种用法，你可以这样:

``` javascript
define(function(require, exports, module){
	var data1 = require("./data1.js");
	var data2 = require("./data2.js");
	
	require.async("./data1.js", "./data2.js", function(data1, data2){});
});
```


# 项目配置

在引入 project.js 前【这里比较懒，并没有做 dom ready 的判定】，如果定义有 window.Project 变量，则可对 project.js 进行配置。

``` html
<script>
var Project = {
	path: {
		// 路径的模板数据
		basePath: "./",    // 项目的根路径，不配置，默认查找 id=projectnode 的脚本
	},
	other: {
		$: window.jQuery
	}
}
</script>
<script src="project.js" id="projectnode"></script>
```

1、path： 路径模板配置

* basePath: 项目的根路径，不配置，默认查找 id=projectnode 的脚本，如果两者均不存在，则查找第1个含有src的脚本，并以该脚本所在目录，做为根目录。

此配置，用于某些特殊场景，如需要给一些域名，添加一个别名，可以这样子:

``` javascript
var Project = {
	path: {
		baidu: "http://www.baidu.com/",
		version: "0.0.2"
	}
};
```
在require的时候，我们就可以使用以下写法:
``` javascript
require("${baidu}");
require("${baidu}/user.js?${version}");  //===> http://www.baidu.com/user.js?0.0.2
```

2、other：板块

某些板块，可能不遵循 define 的定义，可以通过 other 配置，为其指定一个可访问的名称，如:
``` javascript
Project = {
	other: {
		"$": window.jQuery
	}
};
```
在define中，使用如下:
```javascript
var $ = require("$"); // => 拿到了 window.jQuery 
```


# 结语

这次项目，仅针对普通的手机、PC浏览器，其余的，并没考虑。因为比较喜欢 sea.js 和 require.js，两者结合了一下，抱着学习的心态，就完成了这玩意儿。

不写不知道，原以为很多知识点，自己都知道，没什么大不了的，预计1天完成的功能，写了整整3天。其中太多太多一知半解的东西了。

读万卷书，不如行万里路。

如果有BUG，请联系 [da宗熊]  1071093121@qq.com
