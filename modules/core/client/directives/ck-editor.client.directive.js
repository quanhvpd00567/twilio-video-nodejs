(function () {
  'use strict';
  angular.module('core')
    .directive('ckEditor', ckEditor);

  ckEditor.$inject = [];
  function ckEditor() {
    var directive = {
      require: '?ngModel',
      scope: {
        module: '@',
        placeholder: '@'
      },
      link: function (scope, elm, attr, ngModel) {
        // eslint-disable-next-line no-undef
        var ck = CKEDITOR.replace(elm[0], {
          removePlugins: 'save, exportpdf, sourcearea, image',
          language: 'ja',
          editorplaceholder: scope.placeholder || ''
        });

        if (!ngModel) return;

        setTimeout(function () {
          ck.on('pasteState', updateModel);
          ck.on('change', updateModel);
          ck.on('key', updateModel);
        }, 1);

        function updateModel() {
          scope.$apply(function () {
            ngModel.$setViewValue(ck.getData());
          });
        }

        ngModel.$render = function (value) {
          if (ngModel.$viewValue) {
            ck.on('instanceReady', function (event) {
              ck.setData(ngModel.$viewValue);
            });
          }
        };
      }
    };

    return directive;
  }
}());
