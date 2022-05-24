(function () {
  'use strict';

  angular
    .module('events.company.services')
    .factory('EventService', EventService)
    .factory('EventsApi', EventsApi)
    .factory('EventsHelper', EventsHelper);

  EventService.$inject = ['$resource'];

  function EventService($resource) {
    var Event = $resource('/api/events/:eventId', { eventId: '@_id' }, {
      update: { method: 'PUT' },
      send: { method: 'PATCH' }
    });

    angular.extend(Event.prototype, {
      createOrUpdate: function () {
        var event = this;
        return createOrUpdate(event);
      }
    });

    return Event;

    function createOrUpdate(event) {
      if (event._id) {
        return event.$update(onSuccess, onError);
      } else {
        return event.$save(onSuccess, onError);
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

  EventsApi.$inject = ['$http'];
  function EventsApi($http) {
    this.updateById = function (id, body) {
      return $http.put('/api/events/' + id, body);
    };

    this.pagingForHome = function (condition) {
      return $http.post('/api/events/paging_home', { condition: condition }, {});
    };

    this.getDataOfEventOpeningForHome = function () {
      return $http.get('/api/events/opening_home');
    };

    this.list = function (condition) {
      return $http.post('/api/events/paging', { condition: condition }, {});
    };

    this.detail = function (id, companyId) {
      return $http.get('/api/events/detail/' + id, { params: { companyId: companyId } });
    };

    this.updateById = function (id, body) {
      return $http.put('/api/events/' + id, body);
    };

    this.updatePayAndSendStatusById = function (id, body) {
      return $http.put('/api/events/' + id + '/update-pay-and-send-status', body);
    };

    this.export = function (condition) {
      return $http.post('/api/events/export', { condition: condition }, {});
    };

    this.pagingComprojects = function (condition, eventId) {
      return $http.post('/api/events/' + eventId + '/comprojects/paging', { condition: condition });
    };

    this.pagingForMunicipality = function (condition) {
      return $http.post('/api/events/paging-municipality', { condition: condition }, {});
    };

    this.municExport = function (condition) {
      return $http.post('/api/events/munic-export', { condition: condition }, {});
    };

    return this;
  }

  function EventsHelper() {
    // projectIdsSelected, start, end
    var tmpApplyProjectsData = {};

    this.setTmpApplyProjectsData = function (data) {
      tmpApplyProjectsData = data;
    };

    this.clearTmpApplyProjectsData = function () {
      tmpApplyProjectsData = {};
    };

    this.getTmpApplyProjectsData = function () {
      return tmpApplyProjectsData;
    };

    return this;
  }
}());
