// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('move_car', ['ionic', 'move_car.directives', 'move_car.controllers', 'move_car.services', 'move_car.filters', 'move_car.resources'])

.run(function($rootScope, $ionicPlatform, $location, $state, $timeout, $ionicPopup, browser, User, MoveCar) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });

  /*用户登录*/

  //登录成功前禁止视图路由
  
  var next_state = null;
  var next_state_params = null;
  var way = null;
  var login_params = {};
  var unbind_state_change = $rootScope.$on('$stateChangeStart', function(event, to_state, to_params, from_state, from_params){
    event.preventDefault();

    //不重复处理登录
    if(next_state) return;

    next_state = to_state;
    next_state_params = to_params;

    if(browser.is_wx())
    {
      way = 'wx';
    }
    else if(browser.is_cm())
    {
      way = 'cm';
    }
    else
    {
      way = 'cm';
    }

    var url_params_string = window.location.search.replace('?', '');
    if(!url_params_string) alert('参数错误!');

    var url_params_kv_arr = url_params_string.split('&');
    
    angular.forEach(url_params_kv_arr, function(kv){
      var kv_arr = kv.split('=');
      login_params[kv_arr[0]] = kv_arr[1];
    });
    // console.log(login_params);
    // //测试用
    // var login_params = {userId: 'jkzleond@163.com'};
    // way = 'cm';

    User.login(way, login_params, true
    ).success(function(resp){
      if(resp.success)
      {
        var data = resp.data;
        var user = {};
        user.ssid = data.session_id;
        user.guid = data.guid;
        user.info = data.user_info;
        $rootScope.user = user; //保存当前用户信息到rootScope,全局可用
        unbind_state_change();

        $state.go(next_state, next_state_params); //登录成功后继续视图路由
      }
    });
  });

  //再次获取用户信息事件
  $rootScope.$on('user:info_refresh', function(evt){
    User.login(way, login_params, false
    ).success(function(resp){
      if(resp.success)
      {
        var data = resp.data;
        $rootScope.user.ssid = data.session_id;
        $rootScope.user.guid = data.guid;
        $rootScope.user.info = data.user_info;
      }
    });
  });

  //全局捕获事件的方法,用于记录操作日志

  $rootScope.$on('$ionicView.afterEnter', function(evt, view_data){
    var action_name = view_data.stateName;
    var action_title = view_data.title;
    MoveCar.save_oplog(action_name, action_title);
  });

  $rootScope.$on('$mc_oplog', function(evt, op_data){
    MoveCar.save_oplog(op_data.action_name, op_data.action_title);
  });

  //微信分享完成事件
  $rootScope.wx_onshare = function(){
    MoveCar.save_oplog('wx_share', '微信分享');
  };

  //相应后端触发的前端事件
  $rootScope.$on('backend_event.ticket_get', function(evt, data){
    $rootScope.tickets = data.tickets;
    $ionicPopup.show({
      title: '获得福利',
      cssClass: 'ticket-get-popup',
      templateUrl: 'templates/ticket-get-popup.html',
      scope: $rootScope,
      buttons: [
        {
          text: '知道了',
          type: 'button-positive'
        }
      ]
    });
  });
})

.config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, browserProvider) {

  //uniform taps style and position
  $ionicConfigProvider.tabs.style('standard');
  $ionicConfigProvider.tabs.position('bottom');

  //$ionicConfigProvider.views.forwardCache(true);
  $ionicConfigProvider.views.transition('android');

  //scrolling
  browser = browserProvider.$get();
  if(browser.is_wx())
  {
    $ionicConfigProvider.scrolling.jsScrolling(true);
  }
  else
  {
    $ionicConfigProvider.scrolling.jsScrolling(false);
  }
  
  //自定义url参数类型
  $urlMatcherFactoryProvider.type('json', {
    encode: function(object){
      return angular.toJson(object);
    },
    decode: function(json){
      if(!json) return null;
      return angular.fromJson(json);
    }
  });

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.move_car', {
    url: '/move_car',
    views: {
      'tab-move_car': {
        templateUrl: 'templates/tab-move_car.html',
        controller: 'MoveCarCtrl'
      }
    }
  })

  .state('tab.orders', {
      url: '/orders',
      views: {
        'tab-record': {
          templateUrl: 'templates/tab-record.html',
          controller: 'OrdersCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  })

  .state('tab.balance-detail', {
    url: '/account/balance-detail',
    views: {
      'tab-account': {
          templateUrl: 'templates/balance-detail.html',
          controller: 'BalanceDetailCtrl'
      }
    }
  })

  .state('order-detail', {
      url: '/orders/:order_id/{order:json}',
      cache: false,
      templateUrl: 'templates/order-detail.html',
      controller: 'OrderDetailCtrl'
  })

  .state('order-pay', {
    url: '/order/:order_id/pay',
    templateUrl: 'templates/order-pay.html',
    controller: 'OrderPayCtrl'
  })

  .state('order-car_owners', {
    url: '/order/:order_id/car_owners',
    cache: false,
    templateUrl: 'templates/car_owners.html',
    controller: 'CarOwnersCtrl'
  })

  .state('notify', {
    url: '/notify/:order_id/:car_owner_id/:car_owner_source',
    cache: false,
    templateUrl: 'templates/notify.html',
    controller: 'NotifyCtrl'
  })

  .state('call_failed', {
    url: '/call_result/failed?order_id&car_owner_id&car_owner_source',
    params: {
      result: null
    },
    templateUrl: 'templates/call_failed.html',
    controller: 'CallFailedCtrl'
  })

  .state('call_success', {
    url: '/call_success',
    templateUrl: 'templates/call_success.html'
  })

  /*
    申诉view
   */
  .state('appeal', {
    url: '/appeal/:order_id',
    templateUrl: 'templates/appeal.html',
    controller: 'AppealCtrl'
  })

  /*
    反馈view
   */
  .state('feedback', {
      url: '/feedback/:order_id',
      cache: false,
      templateUrl: 'templates/record-feedback.html',
      controller: 'FeedbackCtrl'
    }
  )

  .state('car_list', {
    url: '/car_list',
    templateUrl: 'templates/car_list.html',
    controller: 'CarListCtrl'
  })

  //卡券
  .state('tickets-available', {
    url: '/tickets/available',
    templateUrl: 'templates/ticket-available.html',
    controller: 'TicketAvailableCtrl'
  })

  .state('tickets-expired', {
    url: '/tickets/expired',
    templateUrl: 'templates/ticket-expired.html',
    controller: 'TicketExpiredCtrl'
  })

  // if none of the above states are matched, use this as the fallback
  //$urlRouterProvider.otherwise('/tab/move_car');

});
