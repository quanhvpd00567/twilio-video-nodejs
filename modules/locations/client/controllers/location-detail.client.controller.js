(function () {
  'use strict';

  angular
    .module('locations.admin')
    .controller('LocationDetailController', LocationDetailController);

  LocationDetailController.$inject = ['$scope', '$stateParams', 'locationResolve'];

  function LocationDetailController($scope, $stateParams, location) {
    var vm = this;
    vm.location = location;
    var locationId = $stateParams.locationId;
    vm.locationId = locationId;

    onCreate();

    function onCreate() {
    }
  }
}());
