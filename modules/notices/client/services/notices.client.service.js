(function () {
  'use strict';

  angular
    .module('notices.admin.services')
    .factory('NoticesService', NoticesService)
    .factory('NoticesApi', NoticesApi)
    .factory('NoticesHelper', NoticesHelper);

  NoticesService.$inject = ['$resource'];

  function NoticesService($resource) {
    var Notice = $resource('/api/notices/:noticeId', { noticeId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(Notice.prototype, {
      createOrUpdate: function () {
        var notice = this;
        return createOrUpdate(notice);
      }
    });

    return Notice;

    function createOrUpdate(notice) {
      if (notice._id) {
        return notice.$update(onSuccess, onError);
      } else {
        return notice.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(notice) { }

      // Handle error response
      function onError(errorResponse) {
        var error = errorResponse.data;
        handleError(error);
      }
    }
    function handleError(error) {
      return false;
    }
  }

  NoticesApi.$inject = ['$http'];
  function NoticesApi($http) {
    this.list = function (condition) {
      return $http.post('/api/notices/paging', { condition: condition }, {});
    };

    this.detail = function (noticeId) {
      return $http.get('/api/notices/' + noticeId + '/detail');
    };

    this.stop = function (noticeId) {
      return $http.post('/api/notices/stop', { noticeId: noticeId }, {});
    };

    this.export = function (condition) {
      return $http.get('/api/notices/export', { params: condition });
    };

    return this;
  }

  function NoticesHelper() {
    this.isHideEditButton = function (notice) {
      var now = new Date();
      return new Date(notice.start_time) <= now;
    };

    return this;
  }
}());
