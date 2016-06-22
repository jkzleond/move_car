angular.module('move_car.filters', [])

.filter('time_after', function(){
    return function date_delta(date, format){
        var delta_seconds = Math.floor( ( Date.parse(date) - Date.now() ) / 1000 ) ;
        var delta_hours = Math.floor(delta_seconds / 3600);
        delta_seconds = delta_seconds % 3600;
        var delta_minutes = Math.floor(delta_seconds / 60);
        delta_seconds = delta_seconds % 60;
        return format.replace(/hh|mm|ss/g, function(match){
            //替换回调
            switch(match)
            {
                case 'hh':
                    return delta_hours;
                case 'mm':
                    return delta_minutes;
                case 'ss':
                    return delta_seconds;
                default:
                    return match;
            }
        });
    };
})