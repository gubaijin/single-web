// admin/router.js
'use strict';

app
    .run(
        function ($rootScope,   $state,   $stateParams) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
        }
    )
    .config(
        function ($stateProvider,   $urlRouterProvider) {
          $urlRouterProvider
            .otherwise('/auth/loading');
          $stateProvider
            .state('auth',{
              abstract: true,
              url:'/auth',
              template: '<div ui-view class="fade-in"></div>',
              resolve: {
                deps: ['$ocLazyLoad',
                  function( $ocLazyLoad ){
                    return $ocLazyLoad.load('admin/auth/ctrl.js');
                  }]
              }
            })
            .state('auth.loading',{
              url:'/loading',
              templateUrl:'admin/auth/loading.html',
            })
            .state('auth.login',{
              url:'/login',
              templateUrl:'admin/auth/login.html',
            })
        }
    );
