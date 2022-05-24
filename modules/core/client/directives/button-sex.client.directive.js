(function () {
  'use strict';
  angular.module('core')
    .directive('buttonSex', buttonSex);
  buttonSex.$inject = ['$rootScope', '$state'];

  function buttonSex($rootScope, $state) {
    var directive = {
      restrict: 'E',
      scope: {
        model: '='
      },
      templateUrl: '/modules/core/client/views/template/button-sex.client.view.html'
    };

    return directive;
  }
}());
