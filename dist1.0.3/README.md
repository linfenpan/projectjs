# 修正

IE6 - 9 某些情况下，脚本 onload 的执行，会被大大的延后。

导致 define 执行了 n 次后，才执行 onload 的回调，让某些 require 不能获取到正确的数据
