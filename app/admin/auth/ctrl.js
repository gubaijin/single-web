// admin/auth/ctrl.js
app.controller('LoadingController',function($scope,$resource,$state){
  var $com = $resource($scope.app.host + "/auth/info/?");
  $com.get(function(data){//引入data
    $scope.session_user = $localStorage.user = data; //保存用户信息
    $state.go('app.dashboard');
  })
});
app.controller('LoginController',function($scope,$state,$http,$resource,Base64){
  $scope.login = function(){
    $scope.authError = ""
    var authdata = Base64.encode($scope.user.username + ':' + $scope.user.password);
    $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
    var $com = $resource($scope.app.host + "/auth/info/?");
    $com.get(function(data){//引入data
      $scope.session_user = $localStorage.user = data; //保存用户信息
      $localStorage.auth = authdata;
      $state.go('app.dashboard');
    },function(){
      $scope.authError = "服务器登录错误"
    })
  }
});
app.controller('ListController', function($scope, $resource,$stateParams,$modal,$state) {
  //查询
  $scope.query = function(page,filter){
    var $com = $resource($scope.app.host + "/news/?page=:page&search=:filter",{page:'@page',filter:'@filter'});
    if(!page){
      page=1;
    }else{
      page=parseInt(page);
    }
    $com.get({page:page,filter:filter},function(data){
      //扩展分页数据，显示页签，最终效果为  < 1 2 3 4 5 >
      data.page_index = page;
      data.pages = [];    //页签表
      var N = 5;          //每次显示5个页签
      var s = Math.floor(page/N)*N;
      if(s==page)s-=N;
      s += 1;
      var e = Math.min(data.page_count,s+N-1)
      for(var i=s;i<=e;i++)
        data.pages.push(i)
      $scope.data = data;
      $scope.search_context = filter;
    });
  }
  //搜索跳转
  $scope.search = function(){
    $state.go('app.news.list',{search:$scope.search_context});
  }
  //全选
  var selected = false;
  $scope.selectAll = function(){
    selected = !selected;
    angular.forEach($scope.data.results,function(item){
      item.selected = selected;
    });
  }
  //自定义操作处理，其中1为删除所选记录
  $scope.exec = function(){
    if($scope.operate=="1"){
      var ids = [];
      angular.forEach($scope.data.results,function(item){
        if(item.selected){
          ids.push(item.id);
        }
      });
      if(ids.length>0){
        //弹出删除确认
        var modalInstance = $modal.open({
          templateUrl: 'admin/confirm.html',
          controller: 'ConfirmController',
          size:'sm',
        });
        modalInstance.result.then(function () {
          var $com = $resource($scope.app.host + "/news/deletes/?");
          $com.delete({'ids':ids.join(',')},function(){
            $state.go('app.news.list');
          });
        });
      }
    }
  }
  //根据url参数（分页、搜索关键字）查询数据
  $scope.query($stateParams.page,$stateParams.search);
});

app.controller('ConfirmController', ['$scope', '$modalInstance', function($scope, $modalInstance){
  $scope.ok = function () {
    $modalInstance.close();
  };
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);

app.controller('DetailController', function($rootScope,$scope, $resource, $stateParams,$state) {
  $scope.edit_mode = !!$stateParams.id;
  if($scope.edit_mode){
    var $com = $resource($scope.app.host + "/news/:id/?",{id:'@id'});
    var resp = $com.get({id:$stateParams.id},function(data){
      $scope.data = resp;
    });
  }
  else{
    $scope.data = {};
  }
  $scope.submit = function(){
    if($scope.edit_mode){
      var $com = $resource($scope.app.host + "/news/:id/?",{id:'@id'},{
        'update': { method:'PUT' },
      });
      $com.update({id:$stateParams.id},$scope.data,function(data){
        $state.go($rootScope.previousState,$rootScope.previousStateParams);
      });
    }
    else{
      var $com = $resource($scope.app.host + "/news/?");
      $com.save($scope.data,function(data){
        $state.go('app.news.list');
      });
    }
  };
  $scope.delete = function(){
    var $com = $resource($scope.app.host + "/news/:id/?",{id:'@id'});
    $com.delete({id:$stateParams.id},function(){
      $state.go('app.news.list');
    })
  }
});
app.factory('Base64',function(){
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  return {
    encode: function (input) {
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;

      do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }

        output = output +
          keyStr.charAt(enc1) +
          keyStr.charAt(enc2) +
          keyStr.charAt(enc3) +
          keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
      } while (i < input.length);

      return output;
    },

    decode: function (input) {
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;

      // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
      var base64test = /[^A-Za-z0-9\+\/\=]/g;
      if (base64test.exec(input)) {
        window.alert("There were invalid base64 characters in the input text.\n" +
          "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
          "Expect errors in decoding.");
      }
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

      do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
          output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
          output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

      } while (i < input.length);

      return output;
    }
  };
})
