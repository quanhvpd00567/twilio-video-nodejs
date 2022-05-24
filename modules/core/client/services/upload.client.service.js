(function () {
  'use strict';

  angular
    .module('core')
    .factory('uploadService', uploadService);

  uploadService.$inject = ['FileUploader', 'Notification'];
  function uploadService(FileUploader, Notification) {
    var service = {
      uploader: {},
      prepareUploader: prepareUploader,
      setCallBack: setCallBack
    };

    return service;

    function prepareUploader(url, alias, filter) {
      filter = filter || '|jpg|png|jpeg|bmp|gif|';
      service.uploader = new FileUploader({
        url: url,
        alias: alias
      });

      service.uploader.filters.push({
        name: alias,
        fn: function (item, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          var x = filter.indexOf(type) !== -1;
          if (!x) {
            Notification.error({ message: 'アップロードのファイル形式に誤りがあります。', title: 'Error', delay: 5000 });
          }
          return x;
        }
      });
      return service.uploader;
    }

    function setCallBack(onAfterAddingFile, onSuccessItem, onWhenAddingFileFailed, onErrorItem) {
      service.uploader.onAfterAddingFile = function (fileItem) {
        if (service.uploader.queue.length > 1) {
          service.uploader.queue.splice(0, 1);
        }
        onAfterAddingFile(fileItem);
      };
      service.uploader.onSuccessItem = function (fileItem, response, status, headers) {
        onSuccessItem(response);
      };
      service.uploader.onWhenAddingFileFailed = function () {
        onWhenAddingFileFailed();
      };
      service.uploader.onErrorItem = function (fileItem, response, status, headers) {
        service.uploader.clearQueue();
        onErrorItem(response);
      };
    }
  }
}());
