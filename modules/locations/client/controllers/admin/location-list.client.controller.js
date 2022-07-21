(function () {
  'use strict';

  angular
    .module('locations.admin')
    .controller('LocationListController', LocationListController);

  LocationListController.$inject = ['$scope', 'LocationsService', 'LocationsApi', '$filter'];

  function LocationListController($scope, LocationsService, LocationsApi, $filter) {
    var vm = this;

    vm.onCreateRoomZoom = function () {
      LocationsApi.createZoomRoom().success(function (res) {
        console.log(res);
        vm.token = res;
        console.log('create room success');
      });

    };
  }
}());
