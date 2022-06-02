(function () {
  'use strict';

  angular
    .module('products.admin')
    .controller('ProductFormController', ProductFormController);

  ProductFormController.$inject = ['$scope', '$state', 'product', '$stateParams', 'ProductService', 'ProductApi', '$filter', 'ngDialog', 'uploadService', 'FileUploader'];

  function ProductFormController($scope, $state, product, $stateParams, ProductService, ProductApi, $filter, ngDialog, uploadService, FileUploader) {
    var vm = this;
    vm.product = product;
    vm.master = $scope.masterdata;
    vm.roles = vm.master.munic_roles;
    vm.auth = $scope.Authentication.user;
    vm.numberOfUploadedImages = 0;
    vm.numberOfSelectedImages = 0;
    vm.showBtnChooseFile = true;
    // vm.locations = [];
    vm.constants = {
      OK: 1, // あり
      IS_ACCEPT_SCHEDULE: 1, // 指定不可
      YEAR_ROUND: 1, // 通年
      ALWAYS_STOCK: 1, // 常に在庫あり
      LIMIT_BUY_NONE: 1 // なし
    };
    vm.isFirstLoadEdit = true;

    vm.maxPicture = 7;

    vm.listPictures = [];

    vm.isExcepPlace = false;
    vm.listPicturesSelected = [];

    vm.isCreateRequest = !vm.product._id;
    vm.requestItemId = $stateParams.requestItemId;

    onCreate();

    function onCreate() {
      init();
    }

    function init() {
      vm.imageUrl = $scope.getImageDefault(vm.product.avatar);
      if ($scope.isMunicipality) {
        vm.product.municipality = $scope.Authentication.user.municipalityId;
        getLocationByMunic();
      } else {
        getMunicipality();
      }

      if (!vm.product._id) {
        vm.product.expire = 1;
        vm.product.ship_method = 1;
        vm.product.is_accept_noshi = 1;
        vm.product.is_accept_schedule = 1;
        vm.product.is_apply_condition = true;
        vm.product.is_set_stock_quantity = vm.constants.ALWAYS_STOCK;
        vm.product.is_set_max_quantity = vm.constants.LIMIT_BUY_NONE;
        vm.product.is_deadline = vm.constants.YEAR_ROUND;
      } else {


        if (vm.product.expire !== vm.constants.OK) {
          vm.product.expire_detail = '';
        }

        if (vm.product.except_place_options.includes(2)) {
          vm.isExcepPlace = true;
        }

        if (vm.product.is_set_stock_quantity === vm.constants.ALWAYS_STOCK) {
          vm.product.stock_quantity = '';
        }

        if (vm.product.is_set_max_quantity === vm.constants.LIMIT_BUY_NONE) {
          vm.product.max_quantity = '';
        }

        if (vm.product.is_deadline === vm.constants.YEAR_ROUND) {
          vm.product.deadline = '';
        }

        if (vm.product.pictures.length > 0) {
          vm.listPictures = vm.product.pictures.map(function (item, index) {
            return { order: index, url: item };
          });
        }

        if (vm.product.pictures.length === vm.maxPicture) {
          vm.showBtnChooseFile = false;
        }

        vm.product.municipality = vm.product.municipality._id;
      }
      prepareUploaderImages();
    }

    vm.toggleSelection = function (id) {
      if (vm.product.except_place_options === undefined || vm.product.except_place_options === '') {
        vm.product.except_place_options = [];
      }
      var ids = vm.product.except_place_options.indexOf(id);
      if (ids > -1) {
        vm.product.except_place_options.splice(ids, 1);
      } else {
        vm.product.except_place_options.push(id);
      }
      vm.isExcepPlace = false;
      if (vm.product.except_place_options.includes(2)) {
        vm.isExcepPlace = true;
      } else {
        vm.product.except_place = '';
      }

      if (vm.product.except_place_options.length === 0) {
        vm.product.except_place_options = '';
      }
    };

    // Handle update company
    vm.createOrUpdate = function (isValid) {
      if (!isValid) {
        vm.isSaveClick = true;
        $scope.$broadcast('show-errors-check-validity', 'vm.municMemberForm');

        return false;
      }

      if (vm.listPictures.length === 0) {
        vm.product.pictures = [];
      }

      vm.product.pictures = vm.listPictures.map(function (item) {
        return item.url;
      });

      var messageConfirm = $filter('translate')('products.form.controller.message.confirm_save');
      if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
        messageConfirm = $filter('translate')('request_item.server.message.confirm_register');
      }

      $scope.handleShowConfirm({
        message: messageConfirm
      }, function () {
        $scope.handleShowWaiting();
        vm.product.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);

        function successCallback(res) {
          $scope.handleCloseWaiting();
          $state.go('admin.products.list');

          var message = $filter('translate')('products.form.controller.message.save_success');
          if (vm.municipalityId && vm.isNeedAuthorize === 'true') {
            message = $filter('translate')('request_item.server.message.save_success');
          }
          $scope.handleShowToast(message);
        }
        function errorCallback(error) {
          $scope.handleCloseWaiting();
          var message = error && error.data && error.data.message || $filter('translate')('products.form.controller.message.save_failed');

          $scope.handleShowToast(message, true);
        }
      });
    };

    vm.removeConstructImage = function () {
      $scope.handleShowConfirm({
        message: 'この写真を削除します。よろしいですか？'
      }, function () {
        vm.product.avatar = '';
        vm.imageUrl = $scope.getImageDefault('');
      });
    };

    vm.modalConstructImage = function () {
      $scope.upload = { url: '/api/products/image', name: 'image' };
      $scope.imageUrl = $scope.getImageDefault(vm.product.avantar);

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
              vm.product.avatar = response.image;
              vm.imageUrl = $scope.getImageDefault(vm.product.avatar);

              $scope.uploader.clearQueue();
            }, function () {
              // onWhenAddingFileFailed
              $scope.selected = false;
            }, function (response) {
              // onErrorItem
              $scope.imageUrl = $scope.getImageDefault(vm.product.avatar);

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

    vm.onChangeExpire = function (value) {
      vm.product.expire = value;
      vm.product.expire_detail = '';
    };

    vm.onChangeStockQuantity = function (value) {
      vm.product.is_set_stock_quantity = value;
      vm.product.stock_quantity = '';
    };

    vm.onChangeMaxQuantity = function (value) {
      vm.product.is_set_max_quantity = value;
      vm.product.max_quantity = '';
    };

    vm.onChangeDeadline = function (value) {
      vm.product.is_deadline = value;
      vm.product.deadline = '';
    };

    vm.onChangeSellStatus = function () {
      if (vm.product.sell_status === 2) {
        vm.product.sell_status = 1;
      } else {
        vm.product.sell_status = 2;
      }
    };

    vm.onChangeShowStatus = function () {
      if (vm.product.show_status === 2) {
        vm.product.show_status = 1;
      } else {
        vm.product.show_status = 2;
      }
    };

    vm.isCheckedExceptPlace = function (id) {
      if (vm.product.except_place_options !== undefined) {
        return vm.product.except_place_options.includes(id);
      }
    };

    vm.onChangeAcceptedSchedule = function () {
      if (vm.product.accepted_schedule.length === 0) {
        vm.product.accepted_schedule = '';
      }
    };

    function prepareUploaderImages() {
      vm.uploaderImages = new FileUploader({
        url: '/api/products/upload-pictures',
        alias: 'images'
        // queueLimit: vm.maxPicture - vm.listPictures.length
      });

      vm.uploaderImages.filters.push({
        name: 'images',
        fn: $scope.imageFileFilter
      });

      vm.uploaderImages.onAfterAddingFile = function (fileItem) {
        vm.listPicturesSelected.push(fileItem);
        vm.numberOfSelectedImages = vm.uploaderImages.queue && vm.uploaderImages.queue.length || 0;
        if (vm.listPictures.length === vm.maxPicture) {
          vm.numberOfSelectedImages = 0;
        }

        vm.startUpload();
      };


      vm.uploaderImages.onWhenAddingFileFailed = function () {
        vm.numberOfSelectedImages = 0;
        vm.uploaderImages.clearQueue();
      };

      vm.uploaderImages.onSuccessItem = function (fileItem, response) {
        var order = 0;
        if (vm.listPictures.length > 0) {
          var max = vm.listPictures.reduce(function (a, b) { return (a.order > b.order) ? a : b; });
          order = max.order + 1;
        }

        if (vm.listPictures.length < vm.maxPicture) {
          vm.listPictures.push({ order: order, url: response.imageUrl });
        }

        if (vm.listPictures.length >= vm.maxPicture) {
          vm.showBtnChooseFile = false;
        } else {
          vm.showBtnChooseFile = true;
        }
        calculateProgressToEndUploadSession();
      };

      vm.uploaderImages.onErrorItem = function (fileItem, response, status, headers) {
        var message = $filter('translate')('products.form.pictures.controller.message.upload_pictures_failed');
        vm.errors.push(message);

        calculateProgressToEndUploadSession();
      };

      // vm.uploadImages.onCompleteAll = function () {
      //   endUploadSession();
      // };
    }

    function calculateProgressToEndUploadSession() {
      vm.numberOfUploadedImages += 1;
      if (vm.numberOfUploadedImages === vm.numberOfSelectedImages) {
        endUploadSession();
      }
    }

    vm.removePicture = function (item) {
      var order = item.order;
      $scope.handleShowConfirm({
        message: 'この写真を削除します。よろしいですか？'
      }, function () {
        vm.listPictures = vm.listPictures.filter(function (el) { return el.order !== order; });
        if (vm.listPictures.length < 7) {
          vm.showBtnChooseFile = true;
        }
      });
    };

    function endUploadSession() {
      $scope.handleCloseWaiting();
      resetData();

      if (vm.errors.length > 0) {
        $scope.handleShowToast($filter('translate')('products.form.pictures.controller.message.upload_pictures_failed'), true);
      }
    }

    vm.startUpload = function () {
      // $scope.handleShowWaiting();
      vm.errors = [];
      uploadImages();
    };

    function resetData() {
      vm.numberOfUploadedImages = 0;
      vm.numberOfSelectedImages = 0;
      vm.uploaderImages.clearQueue();
    }


    function uploadImages() {
      if (vm.numberOfSelectedImages) {
        vm.uploaderImages.uploadAll();
      }

      if (!vm.numberOfSelectedImages) {
        endUploadSession();
      }
    }

    function getMunicipality() {
      ProductApi.getMunicipalityAll()
        .success(function (res) {
          vm.municipalities = res;
        });
    }

    function getLocationByMunic() {
      ProductApi.getLocationByMunic(vm.product.municipality)
        .success(function (res) {
          vm.locations = res;
        });
    }

    vm.onChangeMunic = function () {
      vm.product.locations = [];
      getLocationByMunic();
    };
  }
}());
