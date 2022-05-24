(function () {
  'use strict';
  angular.module('core')
    .directive('tablePaging', tablePaging);

  tablePaging.$inject = [];
  function tablePaging() {
    var directive = {
      restrict: 'E',
      templateUrl: '/modules/core/client/views/template/table-paging.client.view.html',
      scope: {
        tbcondition: '='
      }
    };
    return directive;
  }
}());
