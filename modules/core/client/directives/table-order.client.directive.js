(function () {
  'use strict';
  angular.module('core')
    .directive('tableOrder', tableOrder);

  tableOrder.$inject = [];
  function tableOrder() {
    var directive = {
      restrict: 'A',
      templateUrl: '/modules/core/client/views/template/table-order.client.view.html',
      scope: {
        tbcondition: '=',
        tbtitle: '@',
        tbmodel: '@'
      },
      link: function (scope, element) {
        element.addClass('sort');
      }
    };
    return directive;
  }
}());
