angular.module('move_car.directives', [])

/*
    mc-oplog 指令, 用于记录操作日志,
    元素点击时触发 mc-oplog 事件, 配合 $scope 中对该事件的侦听, 可用不同方法记录操作
 */
.directive('mcOplog', function(){
    return {
        restict: 'A',
        link: function(scope, ielement, iattrs){
            var evt_data = scope.$eval(iattrs.mcOplog);
            ielement.on('click', function(event){
                console.log(evt_data);
                scope.$emit('$mc_oplog', evt_data);
            });
        }
    }
})

.directive('wxshare', function($window){
    return {
        restict: 'E',
        replace: true,
        template: '<script></script>',
        scope: {
            url: '@',
            configUrl: '@',
            onshare: '&'
        },
        link: function(scope, ielement, iattrs){
            ielement.attr('src', scope.url);
            var script_ele = ielement[0];
            $window.wxjs_config = function(config){
                console.log(config);
                wx.config({
                    debug: false,
                    appId: config.appId,
                    timestamp: config.timestamp,
                    nonceStr: config.nonceStr,
                    signature: config.signature,

                    jsApiList: [
                        'checkJsApi',
                        'onMenuShareTimeline',
                        'onMenuShareAppMessage',
                        'onMenuShareQQ',
                        'onMenuShareWeibo',
                        'hideMenuItems',
                        'showMenuItems',
                        'hideAllNonBaseMenuItem',
                        'showAllNonBaseMenuItem',
                        'translateVoice',
                        'startRecord',
                        'stopRecord',
                        'onRecordEnd',
                        'playVoice',
                        'pauseVoice',
                        'stopVoice',
                        'uploadVoice',
                        'downloadVoice',
                        'chooseImage',
                        'previewImage',
                        'uploadImage',
                        'downloadImage',
                        'getNetworkType',
                        'openLocation',
                        'getLocation',
                        'hideOptionMenu',
                        'showOptionMenu',
                        'closeWindow',
                        'scanQRCode',
                        'chooseWXPay',
                        'openProductSpecificView',
                        'addCard',
                        'chooseCard',
                        'openCard'
                      // 所有要调用的 API 都要加到这个列表中
                    ]
                });
            }
            
            script_ele.onload = function(){
                var wxData = {
                    "appId": "",
                    "imgUrl" : 'http://ip.yn122.net/cyh/move_car/www/img/car_mate_logo.png',
                    "link" : 'http://ip.yn122.net:8090/mc_api',
                    "desc" : '车友惠挪车',
                    "title" : "车友惠挪车"
                };
                var str_mp = "weixin://profile/gh_8592a4c9c934";//关注的链接
                wx.ready(function () {
                // 2. 分享接口
                // 2.1 监听“分享给朋友”，按钮点击、自定义分享内容及分享结果接口
                    wx.onMenuShareAppMessage({
                      title: wxData.title,
                      desc: wxData.desc,
                      link:wxData.link ,
                      imgUrl: wxData.imgUrl,
                      trigger: function (res) {
                        
                      },
                      success: function (res) {
                      //location.href = str_mp;//关注的链接
                        scope.onshare();
                      },
                      cancel: function (res) {
                       //alert("如此嗨的福利，真的不分享给朋友吗？");
                      },
                      fail: function (res) {
                         alert(JSON.stringify(res));
                      }
                    });

                    wx.onMenuShareTimeline({
                      title: wxData.title,
                      desc: wxData.desc,
                      link: wxData.link,
                      imgUrl: wxData.imgUrl,
                      trigger: function (res) {
                      },
                      success: function (res) {
                        //location.href = str_mp;//关注的链接
                        scope.onshare();
                      },
                      cancel: function (res) { 
                        //alert("如此嗨的福利，真的不分享给朋友吗？");
                      },
                      fail: function (res) {
                        alert(JSON.stringify(res));
                      }
                    });
                    
                    //alert('wx_config ok!');
                });

                wx.error(function (res) {
                  alert(res.errMsg);
                }); 

                //微信jsapi加载完成后加载配置jsonp
                var wxjs_config_script = angular.element('<script></script>');
                wxjs_config_script.attr('src', scope.configUrl + '?callback=wxjs_config&url=' + encodeURIComponent($window.location.href.split('#')[0]));
                ielement.after(wxjs_config_script);  
            };
        }
    }
})
