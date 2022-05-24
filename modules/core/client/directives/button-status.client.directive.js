(function () {
  'use strict';
  angular.module('core')
    .directive('buttonStatus', buttonStatus);
  buttonStatus.$inject = ['$rootScope', '$state'];

  function buttonStatus($rootScope, $state) {
    var directive = {
      restrict: 'E',
      scope: {
        model: '='
      },
      templateUrl: '/modules/core/client/views/template/button-status.client.view.html'
    };

    return directive;
  }
}());
