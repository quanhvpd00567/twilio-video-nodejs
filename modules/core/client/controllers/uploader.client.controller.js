(function () {
  'use strict';

  angular.module('core').controller('UploaderController', UploaderController);

  UploaderController.$inject = ['$scope', 'FileUploader', 'separatorResolve', 'Notification'];

  function UploaderController($scope, FileUploader, separator, Notification) {
    var vm = this;
    vm.separator = separator;
    vm.pathfile;
    onCreate();

    function onCreate() {
      prepareUploader();
    }

    function prepareUploader() {
      vm.url = '/api/' + separator + '/files';
      $scope.uploader = new FileUploader({
        url: vm.url,
        alias: 'filesUpload'
      });
      $scope.uploader.filters.push({
        name: 'asyncFilter',
        fn: function (item, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          var x = '|pdf|'.indexOf(type) !== -1;
          if (!x) {
            Notification.error({
              message: 'アップロードのファイル形式に誤りがあります。',
              title: 'エラー',
              delay: 5000
            });
          }
          return x;
        }
      });
      $scope.uploader.onAfterAddingFile = function (fileItem) {
        vm.selected = true;
        if ($scope.uploader.queue.length > 1) {
          $scope.uploader.queue.splice(0, 1);
        }
      };
      $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
        console.log('response: ', response);
        vm.pathfile = response.path;
      };
    }
  }
}());
