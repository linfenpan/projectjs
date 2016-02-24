/**
 * 生成导航
 *  siteHeader.init();
 *  siteHeader.setLogin(function(){ 设置如何登录 })
 *  siteHeader.setLogout(function(){ 设置如何退出登录 })
 *  siteHeader.setUserInfo(function(){ return {name: 用户名, src: 用户头像} });
 *  siteHeader.setStatus(siteHeader.STATUS.LOGIN | siteHeader.STATUS.LOGOUT);   默认 LOGOUT
 */
define(function(require, exports, module){
    require.css("./siteHeader.css");
    var html = '<header class="site-header">\
        <div class="site-header-left">\
            <a class="logo" href="javascript:;">首页</a>\
        </div>\
        <div class="hide-in-login site-header-right">\
            <a href="javascript:;" class="login">登录</a>\
        </div>\
        <div class="show-in-login site-header-right">\
            <img class="userIco"><span class="userName"></span><a href="javascript:;" class="logout">[退出]</a>\
        </div>\
    </header>';

    function show(elem){
        elem.style.display = "block";
    };
    function hide(elem){
        elem.style.display = "none";
    };

    var siteHeader = {
        init: function(){
            var body = document.body || document.getElementsByTagName("body")[0];
            body.insertAdjacentHTML("afterBegin", html);

            var eRoot = this.eRoot = document.querySelector(".site-header");
            this.eHome = eRoot.querySelector(".logo");
            this.eLogin = eRoot.querySelector(".login");
            this.eLogout = eRoot.querySelector(".logout");
            this.eName = eRoot.querySelector(".userName");
            this.eIco = eRoot.querySelector(".userIco");

            // 用户需要填充3个操作，才能使用全部功能
            this.login = null;
            this.logout = null;
            this.getUserInfo = null;
            this.getHomeInfo = null;

            this.status = this.STATUS.LOGOUT;

            this.bindUI();

            this.init = function(){
                return this.reload();
            };
            return this.reload();
        },
        bindUI: function(){
            var self = this;

            this.eLogin.addEventListener("click", function(){
                self.login && self.login();
            }, false);

            this.eLogout.addEventListener("click", function(){
                self.logout && self.logout();
            }, false);

            this.bindUI = function(){};
        },
        setLogin: function(fn){
            this.login = fn;
            return this.reload();
        },
        setLogout: function(fn){
            this.logout = fn;
            return this.reload();
        },
        setUserInfo: function(fn){
            this.getUserInfo = fn;
            return this.reload();
        },
        setHomeInfo: function(fn){
            this.getHomeInfo = fn;
            return this.reload();
        },
        reload: function(){

            this.login ? show(this.eLogin) : hide(this.eLogin);
            this.logout ? show(this.eLogout) : hide(this.eLogout);

            var info = this.getUserInfo && this.getUserInfo() || null;
            if (info) {
                this.eName.innerHTML = info.name;
                this.eIco.setAttribute("src", info.src);
            }

            info = this.getHomeInfo && this.getHomeInfo() || null;
            if (info) {
                this.eHome.innerHTML = info.text || "";
                this.eHome.setAttribute("href", info.link);
            }

            return this;
        },
        // 设置 登录/登出 的状态
        setStatus: function(status){
            this.status = status;
            var operation = "remove";
            if (this.status === this.STATUS.LOGIN) {
                operation = "add";
            }
            this.eRoot.classList[operation]("site-header-status-login");
        },
        STATUS: {
            LOGIN: "login",
            LOGOUT: "logout"
        }
    };

    module.exports = siteHeader;
});
