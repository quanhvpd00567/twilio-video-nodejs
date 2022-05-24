(function () {
  'use strict';
  angular.module('core')
    .directive('tableSearch', tableSearch);
  tableSearch.$inject = [];

  function tableSearch() {
    var directive = {
      restrict: 'E',
      transclude: true,
      replace: false,
      scope: true,
      templateUrl: '/modules/core/client/views/template/table-search.client.view.html'
    };

    return directive;
  }

  angular.module('core')
    .directive('tableSearchButton', function () {
      return {
        restrict: 'E',
        transclude: true,
        scope: true,
        templateUrl: '/modules/core/client/views/template/table-search-button.client.view.html'
      };
    });

  angular.module('core')
    .directive('tableSearchContent', function () {
      return {
        restrict: 'E',
        transclude: true,
        scope: true,
        templateUrl: '/modules/core/client/views/template/table-search-content.client.view.html'
      };
    });
}());
