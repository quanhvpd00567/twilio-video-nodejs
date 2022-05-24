(function () {
  'use strict';

  angular.module('core')
    .directive('uiSrefIgnore', uiSrefIgnore);

  uiSrefIgnore.$inject = [];

  function uiSrefIgnore() {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element) {
      element.on('click', function (e) {
        var uiSref = element.parents('[ui-sref]').first();
        uiSref.attr({
          target: 'true'
        });

        setTimeout(function () {
          uiSref.attr({
            target: null
          });
        }, 0);
      });
    }
  }
}());
