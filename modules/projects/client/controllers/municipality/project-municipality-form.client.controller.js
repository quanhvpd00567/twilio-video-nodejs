(function () {
  'use strict';

  angular
    .module('projects.municipality')
    .controller('ProjectMunicipalityFormController', ProjectMunicipalityFormController);

  ProjectMunicipalityFormController.$inject = ['$scope', '$stateParams', '$state', 'projectResolve', 'ngDialog', '$filter', 'uploadService', 'ProjectsApi', 'RequestsApplicationApi'];

  function ProjectMunicipalityFormController($scope, $stateParams, $state, project, ngDialog, $filter, uploadService, ProjectsApi, RequestsApplicationApi) {
    var vm = this;
    vm.project = project;
    vm.update = update;
    vm.dateOptionsStartTime = { showWeeks: false, minDate: null, maxDate: null };
    vm.dateOptionsEndTime = { showWeeks: false, minDate: new Date(), maxDate: null };
    vm.auth = $scope.Authentication.user;
    vm.isCreateRequest = !vm.project._id;
    vm.requestItemId = $stateParams.requestItemId;

    onCreate();

    function onCreate() {
      if (vm.requestItemId) {
        $scope.handleShowWaiting();
        RequestsApplicationApi.get(vm.requestItemId)
          .success(function (res) {
            $scope.handleCloseWaiting();
            Object.assign(vm.project, res.data);
            init();
          })
          .error(function (error) {
            $scope.handleCloseWaiting();
            $scope.handleShowToast($scope.parseErrorMessage(error), true);
          });
      } else {
        init();
      }
    }

    function init() {
      vm.municipalityId = $state.params.municipalityId;
      vm.isNeedAuthorize = $state.params.isNeedAuthorize;
      vm.imageUrl = $scope.getImageDefault(vm.project.image);
      // Check permistion when admin or subadmin handle
      if ($scope.isAdminOrSubAdmin && !vm.municipalityId) {
        $scope.handleErrorFeatureAuthorization();
        return;
      }

      if ($state.params.projectIdCloned) {
        delete vm.project._id;
        delete vm.project.code;
        delete vm.project.start;
        delete vm.project.end;
        delete vm.project.created;
      }

      if (vm.project._id) {
        vm.dateOptionsEndTime.minDate = new Date(vm.project.start);
        vm.project.start = new Date(vm.project.start);

        vm.dateOptionsStartTime.maxDate = new Date(vm.project.end);
        vm.project.end = new Date(vm.project.end);

        $scope.handleShowWaiting();
        ProjectsApi.countNumberOfComprojects(vm.project._id)
          .then(function (res) {
            $scope.handleCloseWaiting();
            vm.numberOfComprojects = res && res.data;
          })
          .catch(function (error) {
            $scope.handleCloseWaiting();
            var message = $filter('translate')('common.data.failed');
            $scope.handleShowToast(message, true);
          });
      }
    }

    function update(isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.projectForm');
        return false;
      }

      var messageConfirm = $filter('translate')('project.form.controller.message.confirm_save');
      if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }
      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        $scope.handleShowWaiting();
        if (vm.municipalityId) {
          vm.project.municipalityId = vm.municipalityId;
        }

        if (vm.requestItemId) {
          vm.project.requestItemId = vm.requestItemId;
          if (!vm.isCreateRequest) {
            ProjectsApi.update(vm.project._id, vm.project)
              .success(successCallback)
              .error(errorCallback);
          } else {
            ProjectsApi.create(vm.project)
              .success(successCallback)
              .error(errorCallback);
          }
        } else {
          vm.project.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);
        }

        function successCallback(res) {
          $scope.handleCloseWaiting();
          if (vm.requestItemId) {
            $state.go('municipality.requests_application.list');
          } else if (vm.municipalityId) {
            $state.go('admin.requests_registration.list');
          } else {
            $state.go('municipality.projects.detail', { projectId: res && res._id });
          }
          var message = $filter('translate')('project.form.controller.message.save_success');
          if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('project.form.controller.message.save_failed');
          $scope.handleShowToast(message, true);
        }
      });
    }

    vm.removeConstructImage = function () {
      $scope.handleShowConfirm({
        message: 'この写真を削除します。よろしいですか？'
      }, function () {
        vm.project.image = '';
        vm.imageUrl = $scope.getImageDefault('');
      });
    };

    vm.modalConstructImage = function () {
      $scope.upload = { url: '/api/projects/image', name: 'image' };
      $scope.imageUrl = $scope.getImageDefault(vm.project.image);

      ngDialog.openConfirm({
        templateUrl: '/modules/core/client/views/template/modal-pic-upload.client.view.html',
        scope: $scope,
        showClose: false,
        closeByDocument: false,
        closeByEscape: false,
        width: 600,
        controller: ['$scope', function ($scope) {
          prepareUploader();

          $scope.confirmImage = function (isValid) {
            $scope.isSaveClick = true;
            if (!isValid) {
              $scope.$broadcast('show-errors-check-validity', 'vm.modalImageForm');
              return false;
            }
            if ($scope.selected) {
              $scope.uploader.uploadAll();
            }
            $scope.confirm();
          };

          function prepareUploader() {
            $scope.uploader = uploadService.prepareUploader($scope.upload.url, $scope.upload.name);
            uploadService.setCallBack(function (fileItem) {
              // onAfterAddingFile
              $scope.selected = true;
              var reader = new FileReader();
              reader.onload = function (e) {
                $('#image').attr('src', e.target.result);
                $scope.imageUrl = e.target.result;
              };
              reader.readAsDataURL(fileItem._file);
            }, function (response) {
              // onSuccessItem
              vm.project.image = response.image_url;
              vm.imageUrl = $scope.getImageDefault(vm.project.image);

              $scope.uploader.clearQueue();
            }, function () {
              // onWhenAddingFileFailed
              $scope.selected = false;
            }, function (response) {
              // onErrorItem
              $scope.imageUrl = $scope.getImageDefault(vm.project.image);

              $scope.selected = false;
              $scope.handleCloseWaiting();
              $scope.handleShowToast(response.message, 'エラー');
            });
          }

          vm.removeImage = function () {
            $scope.uploader.clearQueue();
            $scope.image = '';
            $scope.selected = false;
            $scope.imageUrl = $scope.getImageDefault($scope.image);
            $('#image').attr('src', $scope.imageUrl);
          };
        }]
      })
        .then(function (res) {
          delete $scope.image;
        }, function (res) {
          delete $scope.image;
        });
    };

    vm.onChangeStartTime = function () {
      vm.dateOptionsEndTime.minDate = new Date(vm.project.start) >= new Date() ? new Date(vm.project.start) : new Date();
    };

    vm.onChangeEndTime = function () {
      vm.dateOptionsStartTime.maxDate = new Date(vm.project.end);
    };
  }
}());
