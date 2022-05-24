(function () {
  'use strict';

  angular
    .module('munic_members.municipality.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];
  function routeConfig($stateProvider) {
    $stateProvider
      .state('municipality.munic_members', {
        abstract: true,
        url: '/munic-members',
        template: '<ui-view/>'
      })
      .state('municipality.munic_members.list', {
        url: '?{municipalityId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/munic_members/client/views/munic_members-list.client.view.html',
        controller: 'MunicMembersListController',
        controllerAs: 'vm',
        data: {
          roles: ['munic_admin', 'admin', 'sub_admin'],
          pageTitle: '自治体メンバー一覧'
        }
      })
      .state('municipality.munic_members.create', {
        url: '/create?{municipalityId: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/munic_members/client/views/munic_members-form.client.view.html',
        controller: 'MunicMembersFormController',
        controllerAs: 'vm',
        resolve: {
          member: newMember
        },
        data: {
          roles: ['munic_admin', 'admin', 'sub_admin'],
          pageTitle: '自治体メンバー登録'
        }
      })
      .state('municipality.munic_members.edit', {
        url: '/:memberId/edit?{municipalityId: string}&{requestItemId: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/munic_members/client/views/munic_members-form.client.view.html',
        controller: 'MunicMembersFormController',
        controllerAs: 'vm',
        resolve: {
          member: getDetail
        },
        data: {
          roles: ['munic_admin', 'admin', 'sub_admin'],
          pageTitle: '自治体メンバー編集'
        }
      })

      .state('municipality.munic_members.detail', {
        url: '/:memberId/detail?{municipalityId: string}&{requestItemId: string}&{key: string}&{isNeedAuthorize: string}',
        templateUrl: '/modules/munic_members/client/views/munic_members-detail.client.view.html',
        controller: 'MunicMembersDetailController',
        controllerAs: 'vm',
        resolve: {
          member: getDetail
        },
        data: {
          roles: ['munic_admin', 'admin', 'sub_admin'],
          pageTitle: '自治体メンバー詳細'
        }
      });

    getDetail.$inject = ['$stateParams', 'MunicMemberService'];
    function getDetail($stateParams, MunicMemberService) {
      var params = { memberId: $stateParams.memberId };
      if ($stateParams.municipalityId) {
        params.municipalityId = $stateParams.municipalityId;
      }
      return MunicMemberService.get(params).$promise;
    }

    newMember.$inject = ['MunicMemberService'];
    function newMember(MunicMemberService) {
      return new MunicMemberService();
    }
  }
}());
