/*
    资源(从后端服务器获取数据所用)
 */
angular.module('move_car.resources', ['ngResource'])

.constant('resourceConfig', {
    //base_url: 'http://localhost:8091/mc_api/',
    base_url: 'http://116.55.248.76:8090/mc_api/',
    msg_duration: 5000
})

.config(function($httpProvider){
    //开启跨域
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    //发送cookie
    $httpProvider.defaults.withCredentials = true;
    //自动添加Auth-Token header
    $httpProvider.interceptors.push(function($q, $rootScope, $injector){
        return {
            request: function(config){
                config.headers = config.headers || {};
                config.headers['Auth-Token'] = $rootScope.user && $rootScope.user.guid;
                return config;
            },
            response: function(response){
              var res = response.data;
              if(!res.success && res.code == 1001)
              {
                //截获token错误
                $rootScope.$emit('user:info_refresh');
                $injector.get('$state').go('tab.move_car');
              }
              return response;
            }
        }
    });
})

/**
 * 通用资源(包含通用的请求方法)
 */
.factory('Common', function($http, $ionicLoading, resourceConfig){
    var Common = {};

    /**
     * 通用请求方法
     * 可选参数最后一个为 show_loading
     * @param  {String} method
     * @param  {String} url
     * @return {Promise}
     */
    Common.request = function(method, url){
      var show_loading = true;
      var args = [];
      if(arguments.length > 2)
      {
        show_loading = arguments[arguments.length - 1];
        args = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
      }

      var promise = $http[method].apply($http, args);
      if(show_loading)
      {
        //显示loading
        $ionicLoading.show();
        promise
          .success(function(resp){
            if(!resp.success)
            {
              $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
            }
            else
            {
              $ionicLoading.hide();
            }
          })
          .error(function(){
            $ionicLoading.hide();
          });
      }
      else
      {
        promise.success(function(resp){
          if(!resp.success)
          {
            $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
          }
        });
      }
      return promise;
    };

    return Common;
})

/**
 * 用户服务
 * 与后台进行用户相关的数据交互
 */
.factory('User', function($http, $ionicLoading, resourceConfig, popup, Common){
    var User = {};
    
    /**
     * 用户登录
     * @param  {[type]} way
     * @param  {[type]} params
     * @return {[type]}
     */
    User.login = function(way, params, show_loading){
        var login_url = resourceConfig.base_url + 'login/' + way + '.json';
        return Common.request('get', login_url, {params: params}, show_loading);
    };

    /**
     * 获取用户信息
     * @param [user_id]
     */
    User.get_user_info = function(user_id){
        var url = resourceConfig.base_url + 'user.json';
        $ionicLoading.show();
        return $http.get(url, {
                  params:{user_id: user_id}
                })
                .success(function(resp){
                    $ionicLoading.hide();
                }).error(function(){
                    $ionicLoading.hide();
                });
    }

    /**
     * 修改用户电话
     * @param  {String} user_id
     * @param  {String} phone
     * @return {Promise}
     */
    User.modify_phone = function(user_id, phone){
        var url = resourceConfig.base_url + 'user/' + user_id +'/phone.json';
        $ionicLoading.show();
        return $http.put(url, {phone: phone})
          .success(function(resp){
              if(!resp.success)
              {
                $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
              }
              else
              {
                $ionicLoading.hide();
              }
          })
          .error(function(){
              $ionicLoading.hide();
          });
    };

    /**
     * 添加车辆
     * @param {String} user_id
     * @param {String} hphm
     * @return {Promise}
     */
    User.add_car = function(user_id, hphm){
        var url = resourceConfig.base_url + 'user/' + user_id +'/cars.json';
        //发出请求,同时显示loading
        return Common.request('post', url, {hphm: hphm}, true);
    };

    /**
     * 删除车辆信息
     * @param  {Integer} car_id
     * @return {Promise}
     */
    User.delete_car = function(car_id){
        var url = resourceConfig.base_url + 'cars/' + car_id + '.json';
        return Common.request('delete', url, true); 
    }

    /**
     * 修改车辆信息
     * @param  {String} user_id
     * @param  {Integer} car_id
     * @param  {String} hphm
     * @return {Promise}
     */
    User.modify_car = function(user_id, car_id, hphm){
        var url = resourceConfig.base_url + 'user/' + user_id + '/cars/' + car_id + '.json';
        return Common.request('put', url, {hphm: hphm}, true); 
    }

    /**
     * 获取用户车辆列表
     * @param  {String} user_id
     * @param  {Integer} start //用于下拉刷新和无限scroll
     * @param  {Integer} length //用于下拉刷新和无限scroll
     * @param  {Boolean} is_latest //是否加载最新(即是否下拉刷新)用于下拉刷新和无限scroll
     * @return {Promise}
     */
    User.get_car_list = function(user_id, start, length, is_latest){
        var url = resourceConfig.base_url + 'user/' + user_id +'/cars.json';
        var params = {start: start, length: length, is_latest: is_latest};
        return Common.request('get', url, {params: params}, false);
    };

    return User; 
})

//挪车请求资源是
.factory('MoveCar', function($http, resourceConfig, $ionicLoading, Common){
    var MoveCar = {};

    /**
     * 添加订单
     * @param {string} hphm
     * @param {string} phone
     * @param {int} ticket_id
     * @return {Promise}
     */
    MoveCar.add_order = function(hphm, phone, ticket_id){
      var url = resourceConfig.base_url + 'orders.json';
      $ionicLoading.show();
      return $http.post(url, {hphm: hphm, phone: phone, ticket_id: ticket_id}, {responseType: 'json'})
              .success(function(resp){
                  if(!resp.success)
                  {
                    $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
                  }
                  else
                  {
                    $ionicLoading.hide();
                  }
              }).error(function(){
                  $ionicLoading.hide();
              });
    }

    /**
     * 获取指定ID订单信息
     * @param  {int} order_id
     * @return {Promise}
     */
    MoveCar.get_order_by_id = function(order_id){
      var url = resourceConfig.base_url + 'orders/' + order_id + '.json';
      $ionicLoading.show();
      return $http.get(url)
              .success(function(resp){
                if(!resp.success)
                {
                  $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
                }
                else
                {
                  $ionicLoading.hide();
                }
              })
              .error(function(){
                $ionicLoading.hide();
              });
    };

    /**
     * 获取订单轨迹列表
     * @param  {Integer} order_id
     * @return {Promise}
     */
    MoveCar.get_order_track_list = function(order_id){
      var url = resourceConfig.base_url + 'orders/' + order_id + '/track.json';      
      return Common.request('get', url, false);
    }

    /**
     * 获取订单列表
     * @param  {String} user_id
     * @param  {Integer} start //用于下拉刷新和无限scroll
     * @param  {Integer} length //用于下拉刷新和无限scroll
     * @param  {Boolean} is_latest //是否加载最新(即是否下拉刷新)用于下拉刷新和无限scrol
     * @return {Promise}
     */
    MoveCar.get_order_list = function(user_id, start, length, is_latest){
      var url = resourceConfig.base_url + 'user/' + user_id + '/orders.json';
      return Common.request('get', url, {params: {start: start, length: length, is_latest: is_latest}}, false);
    }

    /**
     * 获取指定ID订单相关的车主列表(不含号码)
     * @param  {Integer} order_id
     * @return {Promise}
     */
    MoveCar.get_car_owners_by_order_id = function(order_id){
      var url = resourceConfig.base_url + 'orders/' + order_id + '/car_owners.json';
      $ionicLoading.show();
      return $http.get(url)
              .success(function(resp){
                if(!resp.success)
                {
                  $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
                }
                else
                {
                  $ionicLoading.hide();
                }
              })
              .error(function(){
                $ionicLoading.hide();
              });
    };

    /**
     * 通知指定ID订单相关的某个(指定ID)车主
     * @param  {Integer} order_id
     * @param  {Integer} car_owner_id
     * @param  {String} car_owner_source
     * @return {Promise}
     */
    MoveCar.notify = function(order_id, car_owner_id, car_owner_source){
      var url = resourceConfig.base_url + 'notify.json';
      $ionicLoading.show();
      return $http.post(url, {
                order_id: order_id,
                car_owner_id: car_owner_id,
                car_owner_source: car_owner_source
              })
              .success(function(resp){
                if(!resp.success)
                {
                  $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
                }
                else
                {
                  $ionicLoading.hide();
                }
              })
              .error(function(){
                $ionicLoading.hide();
              });
    };

    /**
     * 订单申诉
     * @param  {Integer} order_id
     * @param  {Object} data
     * @return {Promise}
     */
    MoveCar.appeal = function(order_id, data){
      var url = resourceConfig.base_url + 'orders/' + order_id + '/appeal.json';
      $ionicLoading.show();
      return $http.post(url, data)
              .success(function(resp){
                if(!resp.success)
                {
                  $ionicLoading.show({template: resp.msg, duration: resourceConfig.msg_duration});
                }
                else
                {
                  $ionicLoading.hide();
                }
              })
              .error(function(){
                $ionicLoading.hide();
              });
    };

    /**
     * 订单反馈
     * @param  {Integer} order_id
     * @param  {Object} data
     * @return {Promise}
     */
    MoveCar.feedback = function(order_id, data){
      var url = resourceConfig.base_url + 'orders/' + order_id + '/feedback.json';
      return Common.request('post', url, data, true);
    }

    /**
     * 标记车主
     * @param  {Integer} car_owner_id
     * @param  {String} car_owner_source
     * @param  {Boolean} success
     * @return {Promise}
     */
    MoveCar.mark_car_owner = function(car_owner_id, car_owner_source, success){
      var url = resourceConfig.base_url + 'car_owner/' + car_owner_source + '/' + car_owner_id + '/mark.json';
      return Common.request('put', url, {success: success}, false); 
    }

    return MoveCar;
})

//红包
.factory('Ticket', function($http, resourceConfig){
    var Ticket = {};

    /**
     * 获取卡券
     * @param  {String} user_id
     * @return {Promise} angular promise object
     */
    Ticket.get_tickets = function(user_id, is_expired, start, length, is_latest){
      var url = resourceConfig.base_url + 'tickets/' + user_id +'.json';
      if(is_expired)
      {
        url = resourceConfig.base_url + 'tickets/' + user_id + '/expired.json'
      }
      return $http.get(url, {params: {start: start, length: length, is_latest: is_latest}});
    };

    /**
     * 获取用户红包数量
     * @param  {String} user_id
     * @return {Promise} angular promise object
     */
    Ticket.get_count = function(user_id){
      var url = recourceConfig.base_url + 'tickets/count/' + user_id +'.json';
      return $http.get(url);
    }

    return Ticket;
})