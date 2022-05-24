(function () {
  'use strict';
  angular.module('core')
    .directive('buttonEnable', buttonEnable);
  buttonEnable.$inject = ['$rootScope', '$state'];

  function buttonEnable($rootScope, $state) {
    var directive = {
      restrict: 'E',
      scope: {
        model: '=',
        on: '@',
        off: '@',
        size: '@'
      },
      templateUrl: '/modules/core/client/views/template/button-enable.client.view.html'
    };

    return directive;
  }
}());
