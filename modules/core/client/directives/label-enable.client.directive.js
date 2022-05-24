(function () {
  'use strict';
  angular.module('core')
    .directive('labelEnable', labelEnable);
  labelEnable.$inject = ['$rootScope', '$state'];

  function labelEnable($rootScope, $state) {
    var directive = {
      restrict: 'E',
      scope: {
        model: '='
      },
      templateUrl: '/modules/core/client/views/template/label-enable.client.view.html'
    };

    return directive;
  }
}());
