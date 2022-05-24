(function () {
  'use strict';
  angular.module('core')
    .directive('buttonSave', buttonSave);
  buttonSave.$inject = ['$state', '$window'];

  function buttonSave($state, $window) {
    var directive = {
      restrict: 'E',
      scope: {
        back: '@',
        params: '='
      },
      templateUrl: '/modules/core/client/views/template/button-save.client.view.html',
      link: function (scope) {
        scope.handleBackScreen = function () {
          if ($state.previous.state.name) {
            $state.go($state.previous.state.name, ($state.previous.state.name) ? $state.previous.params : {});
          } else if (scope.back) {
            $state.go(scope.back, scope.params);
          }
        };
      }
    };

    return directive;
  }
}());
