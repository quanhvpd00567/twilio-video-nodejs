(function () {
  'use strict';

  angular
    .module('munic_members.municipality.services')
    .factory('MunicMemberService', MunicMemberService)
    .factory('MunicMemberApi', MunicMemberApi);

  MunicMemberService.$inject = ['$resource'];
  function MunicMemberService($resource) {
    var resource = $resource('/api/munic-members/:memberId', { memberId: '@_id' }, {
      update: { method: 'PUT' }
    });

    angular.extend(resource.prototype, {
      createOrUpdate: function () {
        var member = this;
        return createOrUpdate(member);
      }
    });

    return resource;

    function createOrUpdate(member) {
      if (member._id) {
        return member.$update(onSuccess, onError);
      } else {
        return member.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(event) { }

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

  MunicMemberApi.$inject = ['$http'];
  function MunicMemberApi($http) {
    // Get list employee belong to company
    this.list = function (conditions) {
      return $http.get('/api/munic-members', { params: conditions });
    };
    this.create = function (data) {
      return $http.post('/api/munic-members/', data, {});
    };
    this.update = function (id, data) {
      return $http.put('/api/munic-members/' + id, data, {});
    };
    // Get list subsidiaries belong to company
    this.subsidiaries = function (conditions) {
      return $http.get('/api/subsidiaries', { params: conditions });
    };

    // Get list subsidiaries belong to company
    this.removeMulti = function (data) {
      return $http.post('/api/munic-members/remove-multi', data, {});
    };
    this.isOnlyOneMunicAdmin = function (userId) {
      return $http.post('/api/munic-members/only-one-munic-admin', { userId: userId }, {});
    };

    return this;
  }
}());
