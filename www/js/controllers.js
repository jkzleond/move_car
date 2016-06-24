angular.module('move_car.controllers', [])

.controller('MoveCarCtrl', function($scope, $state, $ionicLoading, popup, MoveCar, Ticket) {

  $scope.form_data = {
    province: '云',
    hphm: null,
    phone: null
  };

  $scope.$watch('user.info.phone', function(){
    $scope.form_data.phone = $scope.user && $scope.user.info && $scope.user.info.phone || null;
  });


  function validate(form){

    if(form.hphm.$error.required)
    {
      popup.alert('表单验证', '请输入车牌号');
      return false; 
    }

    if(form.hphm.$error.pattern)
    {
      popup.alert('表单验证', '车牌号格式不合格');
      return false;
    }

    if(form.phone.$error.required)
    {
      popup.alert('表单验证', '请输入您的电话号码');
    }

    return true;
  };
  


  /**
   * 提交订单
   */
  $scope.submit = function(form){
    if(!validate(form)) return;
    var hphm = $scope.form_data.province + $scope.form_data.hphm;
    var phone = $scope.form_data.phone;
    
    MoveCar.add_order(hphm, phone)
      .success(function(resp){
        if(resp.success)
        {
          $scope.$emit('user:info_refresh');
          $state.go('order-pay', {order_id: resp.order_id});
        }
      });
  };
})

.controller('OrderPayCtrl', function($scope, $state, $stateParams, $ionicPopup, $ionicModal, $ionicLoading, browser, payMent, MoveCar, Ticket){

  $scope.is_cm = browser.is_cm();

  //支付数据(支付方式等)
  $scope.pay_data = {way: 'wxpay'};

  /*
    订单支付controller 
   */
  MoveCar.get_order_by_id($stateParams.order_id)
    .success(function(resp){
        if(resp.success)
        {
          $scope.order = resp.data;
          if(Number($scope.order.total_fee) == 0)
          {
            $scope.order.is_free = true;
          }
        }
    });

  /**
   * 开始选择红包
   */
  $scope.start_select_ticket = function(){
    if($scope.ticket_selector_modal)
    {
      $scope.ticket_selector_modal.show();
    }
    else
    {  
      $ionicModal.fromTemplateUrl('templates/ticket-modal.html', {
        scope: $scope
      }).then(function(modal){
        $scope.ticket_selector_modal = modal;
        $scope.ticket_selector_modal.show();
      });
    }
    $scope.tickets = [];
    $ionicLoading.show();
    Ticket.get_tickets($scope.user.info.user_id).success(function(resp){
      $ionicLoading.hide();
      if(resp.success)
      {
        $scope.tickets = resp.list;
      }
    }).error(function(){
      $ionicLoading.hide();
    });
  };

  /**
   * 选择红包
   * @param  {RedBag}
   */
  $scope.select_ticket = function(ticket){
    //红包类型文字
    switch(ticket.type)
    {
      case '1':
        ticket.type_text = '红包';
        break;
      case '2':
        ticket.type_text = '优惠券';
        break;
      case '3':
        ticket.type_text = '通话时长卡';
        break;
      case '4':
        ticket.type_text = '改价卡';
        break;
      default:
        ticket.type_text = '红包';
    }

    $scope.ticket_selected = ticket;
    $scope.ticket_selector_modal.hide();
  }

  /**
   * 结束红包选择
   */
  $scope.end_select_ticket = function(){
    $scope.ticket_selector_modal.hide();
  }

  /**
   * 订单支付(调用支付接口)
   * @param {String} way 支付方式
   */
  $scope.pay = function(way){
    var ticket_id = $scope.ticket_selected && $scope.ticket_selected.id;
    $scope.ticket_selected = null; //清空选择的票券
    payMent.pay(way, $scope.order.id, ticket_id, function(resp){
      if(resp.success)
      {
        if(resp.code == 'order_free')
        {
          $scope.$emit('user:info_refresh');
          $state.go('order-car_owners', {order_id: $scope.order.id}, {location: 'replace'});
        }
        else if(resp.source == 'wx')
        {
          $scope.$emit('user:info_refresh');
          $state.go('order-car_owners', {order_id: $scope.order.id}, {location: 'replace'});
        }
        else
        {
          $ionicPopup.show({
            title: '支付结果',
            template: '是否成功支付',
            scope: $scope,
            buttons: [
              {
                text: '否',
                type: 'button-assertive',
                onTap: function(evt){
                  return {action: 'N'};
                }
              },
              {
                text: '是',
                type: 'button-positive',
                onTap: function(evt){
                  return {action: 'Y'};
                }
              }
            ]
          }).then(function(res){
            if(res.action == 'Y')
            {
              $scope.$emit('user:info_refresh');
              $state.go('order-car_owners', {order_id: $scope.order.id}, {location: 'replace'});
            }
          });
        }
      }
    });
  }

  /**
   * 免费服务
   */
  $scope.free = function(){
    //免费即直接跳转订单相关车主列表
    $state.go('order-car_owners', {order_id: $scope.order.id}, {location: 'replace'});
  };

  $scope.$on('$destroy', function(){
    //创建过票券选择modal则移除
    $scope.ticket_selector_model && $scope.ticket_selector_modal.remove();
  });

})

.controller('OrdersCtrl', function($scope, $state, MoveCar) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  //
  
  $scope.orders = [];

  /**
   * 加载更多订单
   * @return {[type]}
   */
  $scope.load_more_orders = function(){
    var last_order_id = $scope.orders && $scope.orders.length > 0 && $scope.orders[$scope.orders.length - 1].id || null;
    var length = 20;
    MoveCar.get_order_list($scope.user.info.user_id, last_order_id, length)
      .success(function(resp){
        if(resp.success)
        {
          if(resp.list.length < length)
          {
            $scope.no_more_orders = true; //防止无限scroll,无限加载必须
          }
          $scope.orders = $scope.orders.concat(resp.list);
        }
      }).finally(function(){
        $scope.$broadcast('scroll.infiniteScrollComplete'); //隐藏加载图标的事件
      });
  };

  /**
   * 加载最新订单(下拉刷新)
   * @return {[type]}
   */
  $scope.load_latest_orders = function(){
    var first_order_id = $scope.orders && $scope.orders.length > 0 && $scope.orders[0].id || null;
    MoveCar.get_order_list($scope.user.info.user_id, first_order_id, null, true)
      .success(function(resp){
        if(resp.success)
        {
          $scope.orders = resp.list.reverse().concat($scope.orders);
        }
      })
      .finally(function(){
        $scope.$broadcast('scroll.refreshComplete');
      });
  };

})

.controller('OrderDetailCtrl', function($scope, $state, $stateParams, MoveCar) {
  /*
    订单详情controller
   */
  var order_id = $stateParams.order_id;

  if($stateParams.order)
  {
    $scope.order = $stateParams.order;
  }
  else
  {
    MoveCar.get_order_by_id(order_id)
      .success(function(resp){
        if(resp.success)
        {
          $scope.order = resp.data;
        }
      });
  }

  $scope.tracks = [];

  MoveCar.get_order_track_list(order_id)
    .success(function(resp){
      if(resp.success)
      {
        $scope.tracks = resp.list;
      }
    });
})

.controller('CarOwnersCtrl', function($scope, $state, $stateParams, $timeout, MoveCar){
  /*
    车主列表
   */
  
  var order_id = $stateParams.order_id;

  MoveCar.get_order_by_id(order_id).success(function(resp){
    if(resp.success)
    {
      $scope.order = resp.data;
    }
  });

  MoveCar.get_car_owners_by_order_id(order_id).success(function(resp){
    if(resp.success)
    {
      $scope.car_owners = resp.list;
      if($scope.car_owners.length == 1)
      {
        //只有一个车主电话则直接跳转通知界面
        $scope.notify(order_id, $scope.car_owners[0].id, $scope.car_owners[0].source);
      }
    }
    else
    {
      if(resp.code == 'no_pay')
      {
        $timeout(function(){
          $state.go('order-pay', {order_id: order_id}, {location: 'replace'});
        }, 2000);
      }
      else
      {
        $timeout(function(){
          $state.go('order-detail', {order_id: order_id}, {location: 'replace'});
        }, 2000);
      }
    }
  });

  /**
   * 跳转通知界面
   * @param  {Integer} order_id
   * @param  {Integer} car_onwner_id
   */
  $scope.notify = function(order_id, car_owner_id, car_owner_source){
    $state.go('notify', {order_id:order_id, car_owner_id: car_owner_id, car_owner_source: car_owner_source}, {location: 'replace'});
  }
})

.controller('NotifyCtrl', function($scope, $state, $stateParams, $timeout, $interval, $ionicLoading, MoveCar){
  /*
    通知车主controller
   */
  var order_id = $stateParams.order_id;
  var car_owner_id = $stateParams.car_owner_id;
  var car_owner_source = $stateParams.car_owner_source;

  MoveCar.notify(order_id, car_owner_id, car_owner_source).success(function(resp){
    if(resp.success)
    {
      $scope.data = resp.data;

      //倒计时
      $scope.count_down = 60; 
      $interval(function(){
        $scope.count_down--;
      }, 1000, 60);
    }
    else
    {
      if(resp.code == 'no_pay')
      {
        $timeout(function(){
          $state.go('order-pay', {order_id: order_id}, {location: 'replace'});
        }, 2000);
      }
      else
      {
        $timeout(function(){
          $state.go('order-detail', {order_id: order_id}, {location: 'replace'});
        }, 2000);
      }
    }
  });

  $scope.call_result = function(is_ok){
    if(is_ok)
    {
      MoveCar.mark_car_owner(car_owner_id, car_owner_source, true);
      $state.go('call_success', {location: 'replace'});
    }
    else
    {
      MoveCar.mark_car_owner(car_owner_id, car_owner_source, false);
      $state.go('call_failed', {
        order_id: order_id,
        car_owner_id: car_owner_id,
        car_owner_source: car_owner_source
      }, {location: 'replace'});
    }
  }
})

.controller('CallFailedCtrl', function($scope, $state, $stateParams, MoveCar){
  /*
    呼叫车主失败controller    
   */

  //车主列表
  var order_id = $stateParams.order_id;
  var car_owner_id = $stateParams.car_owner_id;
  var car_owner_source = $stateParams.car_owner_source;

  $scope.order_id = order_id;

  MoveCar.get_car_owners_by_order_id(order_id).success(function(resp){
    if(resp.success)
    {
      $scope.car_owners = resp.list;
      angular.forEach($scope.car_owners, function(car_owner){
        if(car_owner.id == car_owner_id && car_owner.source == car_owner_source)
        {
          $scope.car_owner_selected = car_owner;
        }
      });
    }
  });
})

.controller('AppealCtrl', function($scope, $state, $stateParams, $ionicPopup, MoveCar){
  /*
    申诉controller
   */
  var order_id = $stateParams.order_id;

  $scope.order_id = order_id;

  $scope.problems = [
    {
      text: '语音拨通了,但对方不是车主',
      value: 1
    },
    {
      text: '多次尝试,没有收到电话回拨',
      value: 2
    },
    {
      text: '其他',
      value: 3
    }
  ];

  //表单数据
  $scope.data = {
    problem_selected: null
  };

  $ionicPopup.show({
    title: '申诉',
    templateUrl: 'templates/appeal-confirm-popup.html',
    buttons: [
      {
        text: '知道了',
        type: 'button-positive'
      }
    ]
  });

  function _validate_form(){
    if(!$scope.data.problem_selected)
    {
      $ionicPopup.show({
          title: '表单验证',
          template: '请选择您遇到的问题',
          buttons: [
            {
              text: '确定'
            }
          ]
      });
      return false;
    }

    if($scope.data.problem_selected.value == 3 && !$scope.data.problem_selected.addition)
    {
      $ionicPopup.show({
          title: '表单验证',
          template: '请填写您遇到的问题',
          buttons: [
            {
              text: '确定'
            }
          ]
      });
      return false;
    } 

    return true;
  }

  /**
   * 订单申诉
   * @param  {Integer} order_id
   * @return {Promise}
   */
  $scope.appeal = function(order_id){
    console.log($scope.data);
    if(!_validate_form()) return;
    MoveCar.appeal(order_id, {
      problem: $scope.data.problem_selected.value,
      addition: $scope.data.problem_selected.addition,
      advise: $scope.data.advise
    }).success(function(resp){
      if(resp.success)
      {
        $ionicPopup.show({
          title: '申诉成功',
          templateUrl: 'templates/appeal-success-popup.html',
          scope: $scope,
          buttons: [
            {
              text: '知道了',
              type: 'button-positive',
              onTap: function(e){
                $state.go('tab.move_car');
              }
            }
          ]
        });
      }
    });
  } 
})

.controller('FeedbackCtrl', function($scope, $state, $stateParams, $ionicPopup, MoveCar){
  var order_id = $stateParams.order_id;

  $scope.form_data = {
    q1_1: false,
    q1_2: false,
    q1_3: false,
    q1_4: false,
    q1_5: false,
    q1_6: false,
    q1_7: {
      is_checked: false,
      value: null
    },
    q2: '1',
    advise: null
  };

  $scope.feedback = function(){
    var data = {
      q1_1: $scope.form_data.q1_1,
      q1_2: $scope.form_data.q1_2,
      q1_3: $scope.form_data.q1_3,
      q1_4: $scope.form_data.q1_4,
      q1_5: $scope.form_data.q1_5,
      q1_6: $scope.form_data.q1_6,
      q1_7: $scope.form_data.q1_7.is_checked ? $scope.form_data.q1_7.value : null,
      q2: $scope.form_data.q2,
      advise: $scope.form_data.advise  
    };

    MoveCar.feedback(order_id, data)
      .success(function(resp){
        if(resp.success)
        {
          $ionicPopup.show({
            templateUrl: 'templates/feedback-success-popup.html',
            buttons: [
              {
                text: '知道了',
                type: 'button-positive',
                onTap: function(e){
                  $state.go('tab.orders');
                }
              }
            ]
          });
        }
      });
  }

})

.controller('AccountCtrl', function($scope, $ionicPopup, User) {
  /*
    我的controller
   */
  console.log('account');
   
   $scope.form_data = {};

  /**
   * 修改用户电话
   * @return {[type]}
   */
  $scope.start_modify_phone = function(){

    //弹出编辑窗
    var modify_phone_popup = $ionicPopup.show({
      title: '修改电话号码',
      templateUrl: 'templates/account-modify_phone-popup.html',
      scope: $scope,
      buttons:[
        {
          text: '取消',
          onTap: function(e){
            return {action: 'cancel'};
          }
        },
        {
          text: '修改',
          type: 'button-positive',
          onTap: function(e){
            var new_phone = $scope.form_data.new_phone;
            $scope.form_data.new_phone = null;
            return {action: 'ok', value: new_phone}
          }
        }
      ]
    });

    //提交修改
    modify_phone_popup.then(function(result){
      //点击了取消按钮
      if(result.action == 'cancel') return;
      //验证手机号
      var phone_regex = /^1[34578]\d{9}$/;
      var new_phone = result.value;

      /*TODO checkcode */
      if(!phone_regex.test(new_phone))
      {
        $ionicPopup.alert({
          title: '表单验证',
          template: '电话号码格式不正确',
          okText: '确定'
        });
        return;
      }

      User.modify_phone($scope.user.info.user_id, new_phone)
        .success(function(resp){
          if(resp.success) $scope.user.info.phone = new_phone;
        });

    });
  }
})

.controller('CarListCtrl', function($scope, $state, $ionicPopup, User){

  //车辆列表
  $scope.car_list = [];

  // User.get_car_list($scope.user.info.user_id)
  //   .success(function(resp){
  //     if(resp.success)
  //     {
  //       $scope.car_list = resp.list;
  //     }
  //   });


  $scope.form_data = {province: '云'};

  $scope.start_add_car = function(){
    $ionicPopup.show({
      title: '添加车辆',
      templateUrl: 'templates/car_list-car_form-popup.html',
      scope: $scope,
      buttons: [
        {
          text: '取消',
          onTap: function(e){
            return {action: 'cancel'};
          }
        },
        {
          text: '添加',
          type: 'button-positive',
          onTap: function(e){
            //验证车牌号
            var hphm_reg = /^[a-zA-Z]\w{5}$/;
            var hphm = $scope.form_data.hphm;
            if(!hphm)
            {
              $ionicPopup.alert({
                title: '表单验证',
                template: '车牌号不能为空!',
                okText: '确定'
              });
              e.preventDefault();
              return;
            }

            if(!hphm_reg.test(hphm))
            {
              $ionicPopup.alert({
                title: '表单验证',
                template: '车牌牌号格式不对',
                okText: '确定'
              });
              e.preventDefault();
              return;
            }
            return {action: 'ok', value: {hphm: $scope.form_data.province + $scope.form_data.hphm}};
          }     
        }
      ]
    }).then(function(result){
      if(result.action == 'cancel') return;
      User.add_car($scope.user.info.user_id, result.value.hphm).success(function(resp){
        if(resp.success)
        {
          $scope.car_list.unshift(resp.data);
        }
      });
    });
  };

  /**
   * 删除车辆
   * @param  {Integer} index car Object 在列表中的索引
   * @param  {Object} car
   */
  $scope.del_car = function(index, car){
    User.delete_car(car.id)
      .success(function(resp){
        if(resp.success)
        {
          //server删除成功后从列表删除该车信息
          $scope.car_list.splice(index, 1);
        }
      });
  }

  /**
   * 编辑车辆信息
   * @param  {Object} car
   */
  $scope.modify_car = function(car){
    console.log(car);
    $scope.form_data.province = car.hphm[0];
    $scope.form_data.hphm = car.hphm.slice(1, car.hphm.length);
    $ionicPopup.show({
      title: '编辑车辆',
      templateUrl: 'templates/car_list-car_form-popup.html',
      scope: $scope,
      buttons: [
        {
          text: '取消',
          onTap: function(e){
            $scope.form_data.hphm = null;
            $scope.form_data.province = '云';
            return {action: 'cancel'};
          }
        },
        {
          text: '确定',
          type: 'button-positive',
          onTap: function(e){
            var hphm = $scope.form_data.province + $scope.form_data.hphm;
            $scope.form_data.hphm = null;
            $scope.form_data.province = '云';
            return {action: 'ok', value: {hphm: hphm}};
          }
        },
      ]
    }).then(function(result){
      if(result.action == 'cancel' || (result.action == 'is_ok' && result.value.hphm == car.hphm)) return;
      User.modify_car($scope.user.info.user_id, car.id, result.value.hphm).success(function(resp){
        if(resp.success)
        {
          //根据服务端逻辑, 编辑后有可能id也会变
          car.id = resp.data.id;
          car.hphm = resp.data.hphm;
        }
      });
    });
  };

  /**
   * 加载更多车辆
   */
  $scope.load_more_cars = function(){
    var length = 20;
    var last_car_id = $scope.car_list && $scope.car_list.length > 0 && $scope.car_list[$scope.car_list.length - 1].id || null;

    User.get_car_list($scope.user.info.user_id, last_car_id, length)
    .success(function(resp){
      if(resp.success)
      {
        if(resp.list.length > 0)
        {
          $scope.car_list = $scope.car_list.concat(resp.list);
        }
        if(resp.list.length < length)
        {
          $scope.no_more_cars = true;
        }
      }
    })
    .finally(function(){
        $scope.$broadcast('scroll.infiniteScrollComplete'); //隐藏加载图标的事件
    });
  }; 

  /**
   * 加载最新车辆(下拉刷新)
   */
  $scope.load_latest_cars = function(){
    var first_car_id = $scope.car_list && $scope.car_list.length > 0 && $scope.car_list[0].id || null;

    User.get_car_list($scope.user.info.user_id, first_car_id, null, true)
    .success(function(resp){
      if(resp.success)
      {
        if(resp.list.length > 0)
        {
          $scope.car_list = resp.list.reverse().concat($scope.car_list);//最新数据需要反向排列
        }
      }
    }).finally(function(){
      $scope.$broadcast('scroll.refreshComplete');
    });    
  };

})

.controller('TicketCtrl', function($scope, $state, $stateParams, Ticket){
  Tickets.get_tickets($scope.user.info.user_id)
    .success(function(resp){
      if(resp.success)
      {
        $scope.tickets = resp.list;
      }
    });
})

.controller('TicketAvailableCtrl', function($scope, $state, $stateParams, Ticket){
  $scope.tickets = [];

  /**
   * 刷新可用票券
   */
  $scope.refresh_available_tickets = function(){
    var start = $scope.tickets && $scope.tickets.length > 0 && $scope.tickets[$scope.tickets.length - 1].id || null;
    var length = 10;
    Ticket.get_tickets($scope.user.info.user_id, false, start, length)
      .success(function(resp){
        if(resp.success)
        {
          if(resp.list.length > 0)
          {
            $scope.tickets = $scope.tickets.concat(resp.list);
          }

          if(resp.list.length < length)
          {
            $scope.no_more_tickets = true;
          }
        }
      })
      .finally(function(){
        $scope.$broadcast('scroll.refreshComplete');
      });
  };

  /**
   * 获取更多可用票券
   */
  $scope.load_more_available_tickets = function(){
    var start = $scope.tickets && $scope.tickets.length > 0 && $scope.tickets[$scope.tickets.length - 1].id || null;
    var length = 10;
    Ticket.get_tickets($scope.user.info.user_id, false, start, length)
      .success(function(resp){
        if(resp.success)
        {
          if(resp.list.length > 0)
          {
            $scope.tickets = $scope.tickets.concat(resp.list);
          }

          if(resp.list.length < length)
          {
            $scope.no_more_tickets = true;
          }
        }
      })
      .finally(function(){
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
  };

})

.controller('TicketExpiredCtrl', function($scope, $state, $stateParams, Ticket){
  $scope.tickets = [];

  /**
   * 获取更多过期票券
   */
  $scope.load_more_expire_tickets = function(){
    var start = $scope.tickets && $scope.tickets.length > 0 && $scope.tickets[$scope.tickets.length - 1].id || null;
    var length = 10;
    Ticket.get_tickets($scope.user.info.user_id, true, start, length)
      .success(function(resp){
        if(resp.success)
        {
          if(resp.list.length > 0)
          {
            $scope.tickets = $scope.tickets.concat(resp.list);
          }

          if(resp.list.length < length)
          {
            $scope.no_more_tickets = true;
          }
        }
      })
      .finally(function(){
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
  };
})

.controller('BalanceDetailCtrl', function($scope, BalanceFlow){
  $scope.balance_flow = BalanceFlow.all();
});
