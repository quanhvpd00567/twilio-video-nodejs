(function () {
  'use strict';

  angular.module('core')
    .directive('eventEnter', eventEnter);

  eventEnter.$inject = ['$timeout', '$window'];

  function eventEnter($timeout, $window) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.bind('keydown keypress', function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.eventEnter);
          });

          event.preventDefault();
        }
      });
    }
  }
}());
