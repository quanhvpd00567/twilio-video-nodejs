(function () {
  'use strict';

  // Users service used for communicating with the users REST endpoint
  angular
    .module('users.services')
    .factory('UsersService', UsersService)
    .factory('UsersApi', UsersApi);

  UsersService.$inject = ['$resource'];

  function UsersService($resource) {
    var Users = $resource('/api/users', {}, {
      updatePassword: { method: 'POST', url: '/api/users/password' },
      signin: { method: 'POST', url: '/api/auth/signin' },
      resetPass: { method: 'POST', url: '/api/auth/reset-pass' },
      resetPassEcommerce: { method: 'POST', url: '/api/auth/reset-pass-ecommerce' }
    });

    angular.extend(Users, {
      changePassword: function (passwordDetails) {
        return this.updatePassword(passwordDetails).$promise;
      },
      userSignin: function (credentials) {
        return this.signin(credentials).$promise;
      },
      resetPassword: function (email) {
        return this.resetPass({ email: email }).$promise;
      },
      resetPasswordEcommerce: function (email) {
        return this.resetPassEcommerce({ email: email }).$promise;
      }
    });

    return Users;
  }

  UsersApi.$inject = ['$http'];
  function UsersApi($http) {
    this.config = function () {
      return $http.post('/api/auth/config', {}, {});
    };
    this.home_info = function () {
      return $http.post('/api/user/home_info', {}, {});
    };

    // Confirm register for app
    this.confirm = function (token) {
      return $http.post('/api/member/confirm', { token: token }, {});
    };

    // Confirm update email
    this.confirmUpdatedEmail = function (token) {
      return $http.post('/api/member/confirm-update-email', { token: token }, {});
    };

    return this;
  }
}());
