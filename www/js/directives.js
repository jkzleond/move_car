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
