(function () {
  'use strict';

  angular
    .module('locations.admin')
    .controller('LocationMunicipalityDetailController', LocationMunicipalityDetailController);

  LocationMunicipalityDetailController.$inject = ['$scope', '$stateParams', 'locationResolve'];

  function LocationMunicipalityDetailController($scope, $stateParams, location) {
    var vm = this;
    vm.location = location;
    var locationId = $stateParams.locationId;
    vm.locationId = locationId;

    onCreate();

    function onCreate() {
    }
  }
}());
