angular.module('move_car.services', [])

.factory('browser', function($window){
  var user_agent = $window.navigator.userAgent;

  return {
    is_wx: function(){
      return user_agent.indexOf('MicroMessenger') != -1;
    },
    is_cm: function(){
      return user_agent.indexOf('YN122') != -1;
    }
  }
})

.factory('payMent', function($window, browser, resourceConfig, Common){
  var pay = null;
  if(browser.is_wx())
  {
    pay = function(way, order_id, ticket_id, call_back){
      if(way == 'wxpay')
      {
        var wxpay_url = resourceConfig.base_url + 'orders/' + order_id +'/pay/wxpay.json';
        Common.request('post', wxpay_url, {ticket_id: ticket_id}, true).success(function(resp){
          alert(resp);
          if(resp.success)
          {
            var result = {source: 'wx'};
            if(resp.code == 'order_free')
            {
              result.success = true;
              result.code = 'order_free';
              call_back(result);
              return;
            }

            var wx_pay_param = resp.data;
            WeixinJSBridge.invoke('getBrandWCPayRequest', wx_pay_param,  function(res){
              alert(res);
              if(res.err_msg == 'get_brand_wcpay_request:ok')
              {
                result.success = true;
              }
              else
              {
                result.success = false;
              }
              call_back(result);
            });
          }
        }).error(function(){alert('微信支付错误')});
      }
    };
  }
  else if(browser.is_cm())
  {
    pay = function(way, order_id, ticket_id, call_back){
      var cm_pay_url = resourceConfig.base_url + 'orders/' + order_id +'/pay/cm.json';
      Common.request('post', cm_pay_url, {ticket_id: ticket_id}, true).success(function(resp){
        if(resp.success)
        {
          var result = {source: 'cm', success: true};
          if(resp.code == 'order_free')
          {
            result.code = 'order_free';
            call_back(result);
            return;
          }
          var cm_pay_protocol = resp.data;
          //$window.open(cm_pay_protocol);
          $window.location.href=cm_pay_protocol;
          call_back(result);
        }
      });
    };
  }
  else
  {
    pay = function(way, order_id, ticket_id, call_back){
      var cm_pay_url = resourceConfig.base_url + 'orders/' + order_id +'/pay/cm.json';
      Common.request('post', cm_pay_url, {ticket_id: ticket_id}, true).success(function(resp){
        if(resp.success)
        {
          var result = {source: 'cm', success: true};
          if(resp.code == 'order_free')
          {
            result.code = 'order_free';
            call_back(result);
            return;
          }
          var cm_pay_protocol = resp.data;
          //$window.open(cm_pay_protocol);
          $window.location.href=cm_pay_protocol;
          call_back(result);
        }
      });
    };
  }

  return {
    pay: pay
  };
})

.factory('popup', function($ionicPopup){
  return {
    alert: function(title, content){
      $ionicPopup.show({
        template: content,
        title: title,
        buttons: [{text: '确定'}]
      });
    }
  }
})

.factory('current_user', function($location){
  var request_string = $location.search();
  return {ssid: null, info: {}};
})

.factory('Records', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var records = [{
    id: 0,
    hphm: '云A12345',
    date: '2016-05-10 22:10:10'
  }, {
    id: 1,
    hphm: '云A12345',
    date: '2016-05-10 22:10:10'
  }, {
    id: 2,
    hphm: '云A12345',
    date: '2016-05-10 22:10:10'
  }, {
    id: 3,
    hphm: '云A12345',
    date: '2016-05-10 22:10:10'
  }, {
    id: 4,
    hphm: '云A12345',
    date: '2016-05-10 22:10:10'
  }];

  return {
    all: function() {
      return records;
    },
    remove: function(record) {
      chats.splice(records.indexOf(record), 1);
    },
    get: function(record_id) {
      for (var i = 0; i < records.length; i++) {
        if (records[i].id === parseInt(record_id)) {
          return records[i];
        }
      }
      return null;
    }
  };
})

.factory('BalanceFlow', function(){
  var flow = [
    {
      title: '挪车消费',
      date: '2015-05-10 10:10:00',
      balance_snapshot: 0.00,
      income: -5.00
    },
    {
      title: '挪车消费',
      date: '2015-05-09 9:00:00',
      balance_snapshot: 5.00,
      income: -5.00
    }
  ];

  return {
    all: function() {
      return flow;
    }
  }
});
