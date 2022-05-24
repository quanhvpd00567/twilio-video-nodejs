(function () {
  'use strict';

  angular.module('core')
    .directive('formTitleOnly', formTitle);
  formTitle.$inject = ['$state'];

  function formTitle($state) {
    var directive = {
      restrict: 'E',
      template: '{{pageTitle}}',
      link: link
    };

    return directive;

    function link(scope, element, attributes) {
      var pageTitle = $state.current.data.pageTitle;
      scope.pageTitle = pageTitle;
    }
  }
}());
