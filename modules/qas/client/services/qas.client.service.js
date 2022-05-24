(function () {
  'use strict';

  angular
    .module('qas.admin.services')
    .factory('QAsService', QAsService)
    .factory('QAsApi', QAsApi);

  QAsService.$inject = ['$resource'];

  function QAsService($resource) {
    var QA = $resource('/api/qas/:qaId', { qaId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(QA.prototype, {
      createOrUpdate: function () {
        var qa = this;
        return createOrUpdate(qa);
      }
    });

    return QA;

    function createOrUpdate(qa) {
      if (qa._id) {
        return qa.$update(onSuccess, onError);
      } else {
        return qa.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(qa) { }

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

  QAsApi.$inject = ['$http'];
  function QAsApi($http) {
    this.list = function (condition) {
      return $http.post('/api/qas/paging', { condition: condition }, {});
    };

    this.detail = function (qaId) {
      return $http.get('/api/qas/' + qaId + '/detail');
    };

    return this;
  }
}());
