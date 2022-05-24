(function () {
  'use strict';
  angular.module('core')
    .directive('buttonEdit', buttonEdit);
  buttonEdit.$inject = ['$rootScope', '$state'];

  function buttonEdit($rootScope, $state) {
    var directive = {
      restrict: 'E',
      scope: {
        nohistory: '@',
        back: '@',
        noback: '@',
        notpre: '=',
        state: '@',
        params: '='
      },
      templateUrl: '/modules/core/client/views/template/button-edit.client.view.html',
      link: function (scope) {
        scope.handleBackScreen = function () {
          if (scope.nohistory) {
            $state.go(scope.back, scope.params);
          } else if ($state.previous.state.name) {
            if (scope.state === $state.previous.state.name || scope.noback === $state.previous.state.name) {
              $state.go(scope.back, scope.params);
            } else {
              $state.go($state.previous.state.name, ($state.previous.state.name) ? $state.previous.params : {});
            }
          } else if (scope.back) {
            $state.go(scope.back, scope.params);
          }
        };
      }
    };

    return directive;
  }
}());
