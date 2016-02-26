/*
 * @require jquery.js -> jquery
 * @require ./pop.css
 *
 * @description 基础弹窗组建
 * @author da宗熊
 * @update 2015/01/04
 * @BUG 先引入 jquery.js [明知，但不改]
 */
;(function(){

    var POP = {
        getElemBody: function(){
            return this.getElement("body");
        },
        getElemHtml: function(){
            return this.getElement("html");
        },
        getElemWindow: function(){
            return this.getElement("window", window);
        },
        getElement: function(elem, obj){
            var key = "$" + elem;
            if(!this[key]){
                this[key] = $(obj || elem);
            }
            return this[key];
        },
        isMobile: /iphone|ipod|ipad|ipad|Android|nokia|blackberry|webos|webos|webmate|bada|lg|ucweb/i.test(window.navigator.userAgent)
    };

    // 弹出层索引
    ;(function(POP){
        // 2000 以上的，是弹窗锁定层的领空
        var layerIndex = 2000;
        // 锁定栈，用于判定当前层的位置
        var layerStack = [];

        POP.getLayerIndex = function(layer){
            layerStack.push(layer);
            return layerIndex + layerStack.length * 10;
        };

        POP.recoverLayer = function(layer){
            // 如果全部值都是 null，则重置栈
            var allValueIsNull = true;
            for(var i = 0, max = layerStack.length; i < max; i++){
                var item = layerStack[i];
                if(item === layer){
                    layerStack[i] = null;
                }
                if(item !== null){
                    allValueIsNull = false;
                }
            };
            if(allValueIsNull){
                layerStack = [];
            }
        };
    })(POP);

    // 时间发布moshi
    ;(function(POP, $){
        // 以来 $jqObject，给 source 添加 on/off/fire/clearPublisher[删除$jqObject上的所有事件] 等方法
        POP.createPublisher = function(source, $jqObject){
            $.extend(source, {
                __publisherJqObject: $jqObject || $({}),
                __publisherEventMap: {},
                on: function(event, func, ctx){
                    this.__publisherJqObject.on(event, $.proxy(function(){
                        func.apply(ctx || this, [].slice.call(arguments, 1));
                    }, this));
                    this.__publisherEventMap[event] = 1;
                    return this;
                },
                off: function(){
                    this.__publisherJqObject.off.apply(this.__publisherJqObject, arguments);
                    return this;
                },
                fire: function(){
                    var args = [arguments[0], [].slice.call(arguments, 1)];
                    this.__publisherJqObject.trigger.apply(this.__publisherJqObject, args);
                    return this;
                },
                // 清空发布者的所有事件
                clearPublisher: function(){
                    // 解除所有绑定的事件
                    var eventMap = this.__publisherEventMap;
                    for(var i in eventMap){
                        if(eventMap.hasOwnProperty(i)){
                            this.__publisherJqObject.off(i);
                        }
                    };
                    return this;
                },
                // 销毁发布者
                destroyPublisher: function(){
                    this.clearPublisher && this.clearPublisher();
                    this.__publisherJqObject = this.__publisherEventMap = null;
                    this.on = this.fire = this.off = this.clearPublisher = this.setPublisherContext = null;
                }
            });
        };
    })(POP, $);

    // 锁定层
    ;(function(POP, $){

        var lockIndex = 2000;

        POP.lockLayer = {
            create: function($elem){
                return new LockLayer($elem);
            }
        };

        // 锁定层对象
        function LockLayer($content){
            this.ctor.apply(this, arguments);
        };
        LockLayer.prototype = {
            html: '<div id={id} class="pop-lock-layer">\
                    <div class="pop-lock-layer-back"></div>\
                    <div class="pop-lock-layer-body"></div>\
                </div>',
            ctor: function($content){
                var $body = POP.getElemBody();

                var rootId = "pop-lock-layer-" + Math.round(new Date/1 + Math.random() * 10000);
                $body.append(this.html.replace("{id}", rootId));

                this.$layer = $("#" + rootId);
                this.$body = $(".pop-lock-layer-body", this.$layer);
                this.$back = $(".pop-lock-layer-back", this.$layer);

                this.$body.append($content);
            },
            destroy: function(){
                this.$layer.remove();
                this.setPreventScroll("off");
            },
            show: function(){
                var layerIndex = POP.getLayerIndex(this);
                this._triggerCssLayout();
                this.$layer.addClass("active").css("zIndex", layerIndex);

                // 所有 [data-scroll] 属性的元素，滚动到顶部/底部，touchemove不能穿越
                this.$body.find("[data-scroll]").each(function(i, v){
                    var startY;
                    var $elem = $(v);
                    function point(e){
                        e = e.targetTouches && e.targetTouches[0] || e.changedTouches && e.changedTouches[0] || e;
                        return {y: e.pageY};
                    };
                    $elem.off("touchstart").on("touchstart", function(e){
                        startY = point(e.originalEvent).y;
                    });
                    $elem.off("touchmove").on("touchmove", function(e){
                        var moveY = point(e.originalEvent).y - startY;
                        var scrollTop = this.scrollTop;
                        if (scrollTop <= 0 && moveY > 0) {
                            e.preventDefault();
                            return false;
                        } else if (moveY < 0 && Math.abs(this.scrollHeight - this.offsetHeight - scrollTop) <= 1) {
                            e.preventDefault();
                            return false;
                        }
                    });
                });
            },
            hide: function(){
                POP.recoverLayer(this);
                this._triggerCssLayout();
                this.$layer.removeClass("active");

                this.$body.find("[data-scroll]").off("touchstart touchmove");
            },
            _triggerCssLayout: function(){
                this.$layer[0].getClientRects();
            }
        }
    })(POP, $);


    // 弹窗组件
    ;(function(POP, $){
        POP.dialog = {
            create: function($root, options){
                // beforeShow: function(){}
                // onClose: function(){}
                // closeIfClickBack: false
                return new Dialog($root, options);
            }
        };

        function Dialog($root, options){
            return this.ctor.apply(this, arguments);
        };
        Dialog.prototype = {
            ctor: function($root, options){

                // 如果是字符串，则插入到 $body 中，并且隐藏
                if(typeof $root === "string"){
                    $root = $($root);
                    // 标志 $root 元素的类型，在 destroy 的时候，发现是 html，则连同父亲一并删除
                    this.rootType = "html";
                }

                // pop-dialog 是初始化标志，保存了当前的 dialog 对象
                if($root.data("pop-dialog")){
                    return $root.data("pop-dialog");
                };
                $root.data("pop-dialog", this);

                // 记录原始位置
                if(this.rootType !== "html"){
                    $root.wrap("<div></div>");
                    this.$originalPlace = $root.parent();
                }

                this.layer = POP.lockLayer.create($root);
                this.$root = $root;

                this.options = $.extend({
                    onBeforeShow: function(){},
                    onClose: function(){},
                    // 点击黑色处，是否关闭
                    closeIfClickBack: false
                }, options || {});

                // 创建发布者
                POP.createPublisher(this, $root);

                this.fnWindowResize = $.proxy(this.fixRootPosition, this);

                this.bindUI();

                return this;
            },
            bindUI: function(){
                if(this.options.closeIfClickBack){
                    var $layerBody = this.layer.$body;
                    $layerBody.on("click", $.proxy(function(e){
                        if(e.target === $layerBody[0]){
                            this.hide();
                        }
                    }, this));
                }

                var self = this;
                this.$root.on("click", "[data-role]", function(e){
                    var $elem = $(this);
                    var role = $elem.data("role");
                    switch(role){
                        case "hide":
                        case "close":
                            self.hide();
                            break;
                        default:
                            self.fire(role, $elem, e);
                    }
                });

                this.$root.addClass("pop-dialog");
            },
            show: function(){
                this.options.onBeforeShow.call(this);
                this.fire("beforeShow");
                this.layer.show();
                this.fire("show");

                var $window = POP.getElemWindow();
                $window.on("resize orientationchange", this.fnWindowResize);
                this.fnWindowResize();

                return this;
            },
            hide: function(){
                // 锁定操作之后，不能关闭
                if(this.isLock){
                    return this;
                }

                // 如果 onClose 含有 done 对象，或返回了 false，则取消自动关闭操作
                var closeRes = this.options.onClose.call(this);
                if(closeRes && closeRes.done){
                    closeRes.done($.proxy(this._close, this));
                }else if(closeRes !== false){
                    this._close();
                }

                return this;
            },
            setOnClose: function(close){
                this.options.onClose = close;
                return this;
            },
            setOnBeforeShow: function(beforeShow){
                this.options.onBeforeShow = beforeShow;
                return this;
            },
            // 锁定操作
            lock: function(isLock){
                this.isLock = typeof isLock !== "undefined" ? isLock : true;
                return this;
            },
            unlock: function(){
                this.isLock = false;
                return this;
            },
            _close: function(){
                this.layer.hide();
                this.fire("hide");

                var $window = POP.getElemWindow();
                $window.off("resize orientationchange", this.fnWindowResize);

                var $html = POP.getElemHtml();
                $html.removeClass("pop-dialog-open");
            },
            destroy: function(){
                // 销毁发布者
                this.destroyPublisher();

                // 文档类型的，删除掉 父亲+自己 即可
                if(this.rootType === "html"){
                    this.$root.remove();
                    this.$root = null;
                }else{
                    // 解绑事件
                    this.$root.off("click", "[data-role]");
                    // this.$root.find("[data-scroll]").off("touchstart touchmove");

                    // 修正元素属性
                    this.$root.removeClass("pop-dialog");
                    this.$root.data("pop-dialog", false);

                    // 把元素放回原来位置
                    this.$originalPlace.append(this.$root);
                    this.$root.unwrap();
                    this.$originalPlace = null;
                }

                // 销毁 layer 层
                this.layer.$body.off("click");
                this.layer.destroy();

            },
            // 修正 $root 的位置
            fixRootPosition: function(){
                var $html = POP.getElemHtml();
                var $root = this.$root;
                var layerHeight = Math.max(this.layer.$layer.height(), window.innerHeight);
                var rootWidth = $root.outerWidth(), rootHeight = $root.outerHeight() + parseInt($root.css("margin-top")) + parseInt($root.css("margin-bottom"));

                if(rootHeight > layerHeight){
                    $root.css({top: 0});
                    $html.addClass("pop-dialog-open");
                }else{
                    $root.css({top: (layerHeight - rootHeight) / 2 * 0.6});
                    $html.removeClass("pop-dialog-open");
                }
                // @Error 移动端，如果内容比屏幕的宽度*50%还要大，那么，计算出来的 rootWidth，则会只有屏幕的一半，这里通过 .pop-dialog 样式，来设置 translateX(-50%) 解决
                // $root.css({marginLeft: -rootWidth / 2});
                return this;
            }
        };
    })(POP, $);


    // 确认组件，基于 POP.dialog
    ;(function(POP, $){
        POP.confirm = function(html, options){
            return new Confirm(html, options);
        };

        function Confirm(html, options){
            this.ctor.apply(this, arguments);
        };
        Confirm.prototype = {
            ctor: function(html, options){
                // 合并参数
                var options = $.extend({title: "提示", btns: [{}, {}]}, options || {});
                var defBtns = [{
                    text: "取消",
                    color: "cancel",
                    callback: function(){}
                }, {
                    text: "确认",
                    color: "sure",
                    callback: function(){}
                }];

                // 合并按钮默认值
                var btns = options.btns;
                for(var i = 0, len = Math.min(btns.length, defBtns.length); i < len; i++){
                    btns[i] = $.extend(defBtns[i], btns[i]);
                };

                this.options = options;
                html = this.createContent(html);

                this.dialog = POP.dialog.create(html, $.extend({closeIfClickBack: false}, options));
                this.$root = this.dialog.$root;

                this.bindUI();

                this.dialog.show();
            },
            createContent: function(content){
                var options = this.options;
                var html = '<div class="pop-dialog-confirm pop-dialog-white">\
                                <p class="pop-dialog-title">'+ (options.title || "") +'</p>\
                                <div class="content">'+ content +'</div>\
                                <div class="operation"></div>\
                            </div>';
                return html;
            },
            bindUI: function(){
                this.createAndBindBtn();

                this.dialog.on("close", function(){
                    setTimeout($.proxy(function(){
                        this.destroy();
                    }, this), 500);
                });
            },
            createAndBindBtn: function(){
                var btns = this.options.btns;
                var $root = this.dialog.$root.find(".operation");
                for(var i = 0, len = btns.length; i < len; i++){
                    var item = btns[i];
                    var $btn = $('<a href="javascript:;" class="pop-dialog-btn pop-dialog-'+ item.color +'">'+ item.text +'</a>');
                    $btn.click(this.getBtnClickFn(item.callback));
                    $root.append($btn);
                }
            },
            getBtnClickFn: function(callback){
                var self = this;
                var dialog = this.dialog;
                // 遇到 false 或 Deferred 对象，则暂停
                return function(e){
                    var res = callback && callback.call(this, e, dialog, self);
                    if(res === false){
                        // 等待正确才关闭
                    }else if(res && res.done){
                        res.done(function(){
                            dialog.hide();
                        });
                    }else{
                        dialog.hide();
                    }
                };
            }
        }
    })(POP, $);


    // 自动弹出
    ;(function(POP, $){
        // 自动弹出提醒
        POP.autoTip = function(html, options){
            var $root = $('<div class="pop-auto"><div class="pop-auto-tip">' + html + '</div></div>');
            var options = $.extend({
                time: 3500,
                root: POP.getElemBody(),
                top: 0,
                callback: null
            }, options || {});
            var $body = typeof options.root === "string" ? $(options.root) : options.root;

            $body.append($root);

            // 触发动画
            $root[0].getClientRects();
            $root.addClass("active");


            // 修正位置
            var windowWidth = Math.max(window.innerWidth, POP.getElemHtml().width());
            $root.css({
                marginTop: -($root.outerHeight() / 2),
                zIndex: POP.getLayerIndex($root)
            });
            options.top && $root.css({"top": options.top, "position": "absolute"});


            // 定时删除
            var timer = setTimeout(function(){
                $root.removeClass("active");

                setTimeout(function(){
                    POP.recoverLayer($root);
                    $root.remove();
                    $root = null;
                    options.callback && options.callback();
                }, 500);
            }, options.time);

            return $root;
        };
    })(POP, $);

    if (window.define) {
        window.define(function(require, exports, module){
            require("./POP.css");
            module.exports = POP;
        });
    } else {
        window.POP = POP;
    }
})();
