'use strict';

angular.module('core').controller('AppController', AppController);

AppController.$inject = [
  '$scope',
  '$state',
  '$stateParams',
  'Authentication',
  'ngDialog',
  'Notification',
  'ConditionFactory',
  'Masterdata',
  'TemplateFactory',
  'FileUploader',
  '$filter'
];

function AppController(
  $scope,
  $state,
  $stateParams,
  Authentication,
  ngDialog,
  Notification,
  ConditionFactory,
  Masterdata,
  TemplateFactory,
  FileUploader,
  $filter
) {
  $scope.Authentication = Authentication;
  $scope.masterdata = Masterdata.masterdata;
  $scope.NO_IMAGE_PATH = '/modules/core/client/img/no-image.jpg';
  $scope.NO_IMAGE_STAMP_PATH = '/modules/core/client/img/stamp_default.jpg';
  $scope.NO_AVATAR_PATH = '/modules/core/client/img/avatar-default.png';
  $scope.timeStartDayStr = ' 00:00:00.000';
  $scope.timeEndDayStr = ' 23:59:59.999';
  $scope.itemsPerPage = 20;
  $scope.formatDate = 'yyyy/MM/dd';
  $scope.dateOptions = { showWeeks: false };
  $scope.timeOptions = { showMeridian: false };
  $scope.socketClient = initSocketClient();
  $scope.numberOfPendingRequests = $scope.Authentication && $scope.Authentication.user && $scope.Authentication.user.numberOfPendingRequests || 0;

  if (!Authentication.user || !Authentication.user.roles || Authentication.user.roles.length === 0) {
    $scope.role = 'guest';
  } else {
    $scope.user = Authentication.user;
    $scope.role = Authentication.user.roles[0];
  }
  $scope.isAdmin = $scope.role === 'admin';
  $scope.isAdminOrSubAdmin = $scope.role === 'admin' || $scope.role === 'sub_admin';
  $scope.isMunicipality = $scope.role === 'municipality';

  /** roles */
  $scope.roles = [
    { id: 'admin', name: '管理者', class: 'label-danger' },
    { id: 'user', name: '学生', class: 'label-success' }
  ];

  $scope.isCompany = function (roles) {
    if (!roles || roles.length === 0) {
      return false;
    }
    return roles.indexOf('company') !== -1;
  };

  $scope.isMunicAdmin = function (roles) {
    if (!roles || roles.length === 0) {
      return false;
    }
    return roles.indexOf('munic_admin') !== -1;
  };

  $scope.handleLoggedIn = function (user) {
    var role = user && user.roles[0];
    switch (role) {
      case 'admin':
      case 'sub_admin':
        $scope.handleBackScreen('admin.products.list');
        break;
      case 'municipality':
        $scope.handleBackScreen('municipality.orders.list');
        break;
      default:
        break;
    }
  };

  $scope.handleBackScreen = function (state) {
    $state.go($state.previous.state.name || state, ($state.previous.state.name) ? $state.previous.params : {});
  };

  $scope.excelFilter = function (item) {
    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
    var x = '|vnd.openxmlformats-officedocument.spreadsheetml.sheet|'.indexOf(type) !== -1;
    if (!x)
      Notification.error({ message: 'アップロードのファイル形式に誤りがあります。', title: 'Error', delay: 5000 });
    return x;
  };

  $scope.replaceToNumber = function (value) {
    if (!value || value === '') return 0;
    var number = value.replace(/,/g, '');
    return +number;
  };

  $scope.handleBackScreen = function (state) {
    $state.go($state.previous.state.name || state, $state.previous.state.name ? $state.previous.params : {});
  };
  $scope.handleShowToast = function (msg, error) {
    if (error)
      return Notification.error({ message: msg + '', title: '<i class="glyphicon glyphicon-remove"></i> エラー: ' });
    return Notification.success({ message: msg, title: '<i class="glyphicon glyphicon-ok"></i> 完了' });
  };
  $scope.handleShowImage = function (url) {
    $scope.url = url;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.image_view,
        scope: $scope,
        appendClassName: 'ngdialog-custom',
        showClose: false,
        width: 900
      })
      .then(
        function (res) {
          delete $scope.url;
        },
        function (res) {
          delete $scope.url;
        }
      );
  };
  $scope.handleShowPDF = function (url) {
    $scope.url = url;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.pdf_view,
        scope: $scope,
        appendClassName: 'ngdialog-custom',
        showClose: false,
        width: 1500
      })
      .then(
        function (res) {
          delete $scope.url;
        },
        function (res) {
          delete $scope.url;
        }
      );
  };
  $scope.handleShowConfirm = function (content, resolve, reject) {
    $scope.dialog = content;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.confirm,
        scope: $scope,
        showClose: false,
        closeByDocument: content.closeByDocument !== 1
      })
      .then(
        function (res) {
          delete $scope.dialog;
          if (resolve) {
            resolve(res);
          }
        },
        function (res) {
          delete $scope.dialog;
          if (reject) {
            reject(res);
          }
        }
      );
  };
  $scope.handleShowConfirmOk = function (content, resolve, reject) {
    $scope.dialog = content;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.confirm_ok,
        scope: $scope,
        showClose: false,
        closeByDocument: false
      })
      .then(
        function (res) {
          delete $scope.dialog;
          if (resolve) {
            resolve(res);
          }
        },
        function (res) {
          delete $scope.dialog;
          if (reject) {
            reject(res);
          }
        }
      );
  };
  $scope.handleShowDownload = function (content, resolve, reject) {
    $scope.dialog = content;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.download,
        scope: $scope,
        showClose: false
      })
      .then(
        function (res) {
          delete $scope.dialog;
          if (resolve) {
            resolve(res);
          }
        },
        function (res) {
          delete $scope.dialog;
          if (reject) {
            reject(res);
          }
        }
      );
  };
  $scope.handleTextInput = function (content, resolve, reject) {
    $scope.dialog = content;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.text_input,
        scope: $scope,
        showClose: false
      })
      .then(
        function (res) {
          delete $scope.dialog;
          if (resolve) {
            resolve(res);
          }
        },
        function (res) {
          delete $scope.dialog;
          if (reject) {
            reject(res);
          }
        }
      );
  };

  $scope.handleListCompany = function (content, resolve, reject) {
    $scope.dialog = content;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.list_company,
        scope: $scope,
        width: 1000,
        showClose: false,
        // controller: 'CompanyFormController',
        controllerAs: 'vm'
        // controller: ['$scope', function ($scope) {
        //   $scope.onSelectNumber = function (number) {
        //     console.log(number);
        //   };
        // }]
      })
      .then(
        function (res) {
          delete $scope.dialog;
          if (resolve) {
            resolve(res);
          }
        },
        function (res) {
          delete $scope.dialog;
          if (reject) {
            reject(res);
          }
        }
      );
  };

  $scope.handleShowWaiting = function () {
    $scope.dialog = {};
    $scope.dialog = ngDialog.open({
      templateUrl: TemplateFactory.waiting,
      scope: $scope,
      closeByDocument: false,
      showClose: false
    });
  };
  $scope.handleCloseWaiting = function () {
    if ($scope.dialog) $scope.dialog.close();
  };
  $scope.handleOpenUploader = function (separator, resolve, reject) {
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.pdf_uploader,
        appendClassName: 'ngdialog-custom',
        scope: $scope,
        showClose: false,
        width: 1000,
        closeByDocument: false,
        controller: 'UploaderController',
        controllerAs: 'vm',
        resolve: {
          separatorResolve: function () {
            return separator;
          }
        }
      })
      .then(
        function (res) {
          if (resolve) return resolve(res);
        },
        function (err) {
          if (reject) return reject(err);
        }
      );
  };

  $scope.getPageTitle = function () {
    return $state.current.data.pageTitle;
  };
  $scope.parseDate = function (date) {
    try {
      date = new Date(date);
    } catch (err) {
      return date;
    }
    return date;
  };
  $scope.noIndex = function (currentPage, itemsPerPage, index) {
    return (currentPage - 1) * itemsPerPage + index + 1;
  };

  $scope.prepareCondition = function (module, clear, condition) {
    if (!clear && ConditionFactory.get(module)) {
      condition = ConditionFactory.get(module);
    } else {
      if (!condition) {
        condition = {};
      }
      if (!condition.limit) {
        condition.limit = $scope.itemsPerPage;
      }
      if (!condition.sort_column) {
        condition.sort_column = 'created';
      }
      if (!condition.sort_direction) {
        condition.sort_direction = '-';
      }
      if (!condition.page) {
        condition.page = 1;
      }
      ConditionFactory.set(module, condition);
    }

    return condition;
  };

  $scope.handleSortChanged = function (condition, sort_column) {
    if (condition.sort_column === sort_column) {
      if (condition.sort_direction === '-') {
        condition.sort_direction = '+';
      } else {
        condition.sort_direction = '-';
      }
    } else {
      condition.sort_column = sort_column;
      condition.sort_direction = '-';
    }
    condition.page = 1;

    return condition;
  };

  $scope.conditionFactoryUpdate = function (module, condition) {
    ConditionFactory.update(module, condition);
  };

  $scope.tableIndex = function (condition, index) {
    if (condition.page && condition.limit) {
      return (condition.page - 1) * condition.limit + index + 1;
    }
    return index + 1;
  };

  $scope.tableReport = function (condition) {
    if (!condition) {
      return;
    }
    var out = '';
    if (condition.total) {
      out = '全 ' + condition.total + ' 件';
      var min = (condition.page - 1) * condition.limit + 1;
      var max = min + condition.count - 1;
      out += '中 ' + min + ' 件目 〜 ' + max + ' 件目を表示';
    } else {
      out = '全 0 件';
    }
    return out;
  };

  $scope.picker = {
    created_min: { open: false },
    created_max: { open: false },
    start: { open: false },
    end: { open: false },
    work_start: { open: false },
    work_end: { open: false }
  };
  $scope.openCalendarSearch = function (e, picker) {
    $scope.picker[picker].open = true;
  };

  $scope.open = {};
  $scope.openCalendar = function (e, date) {
    e.preventDefault();
    e.stopPropagation();

    if ($scope.open[date] === true) {
      $scope.open = {};
    } else {
      $scope.open = {};
      $scope.open[date] = true;
    }
  };

  $scope.tab = {};
  $scope.getValueByKey = function (object, key) {
    if (!object) return '';
    return object[key];
  };


  $scope.getNameByIDFromMasterdata = function (masterdatas, id) {
    var tmp = _.find(masterdatas, function (item) {
      return item.id === id;
    });
    return tmp ? tmp.name : null;
  };

  $scope.money = function (num, is_dola) {
    var regex = /(\d)(?=(\d\d\d)+(?!\d))/g;
    if (is_dola) {
      return num ? 'US$' + num.toFixed(2).replace(regex, '$1,') : 0;
    }
    return num ? num.toString().replace(regex, '$1,') : 0;
  };

  $scope.getCurrentDate = function () {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    return today;
  };

  $scope.convertDateUTC = function (date) {
    var dateUTC = moment.utc(date).toDate();
    return dateUTC;
  };
  $scope.getImageDefault = function (image) {
    if (!image) {
      return $scope.NO_IMAGE_PATH;
    } else {
      return image;
    }
  };
  $scope.showMasterValue = function (list, id) {
    if (list && list.length > 0) {
      var index = -1;
      for (var i = 0; i < list.length; ++i) {
        if (list[i].id === id) {
          index = i;
          break;
        }
      }
      if (list[index] && list[index].value) {
        return list[index].value;
      }
      return id;
    }
    return id;
  };
  $scope.handleShowErrorNotification = function (content, resolve, reject) {
    $scope.dialog = content;
    ngDialog
      .openConfirm({
        templateUrl: TemplateFactory.error_notification,
        scope: $scope,
        showClose: false
      })
      .then(
        function (res) {
          delete $scope.dialog;
          if (resolve) {
            resolve(res);
          }
        },
        function (res) {
          delete $scope.dialog;
          if (reject) {
            reject(res);
          }
        }
      );
  };

  var imageType = [
    'image/png',
    'image/jpg',
    'image/jpeg'
    // 'image/gif'
  ];
  $scope.imageFileFilter = function (file) {
    if (imageType.indexOf(file.type) < 0) {
      Notification.error({ message: 'アップロードのファイル形式に誤りがあります。', title: 'エラー', delay: 5000 });
      return false;
    }
    return true;
  };
  $scope.preventPressCommaKey = function (event) {
    // comma (,) - keycode = 188
    if (event.keyCode === 188) {
      event.preventDefault();
    }
  };
  $scope.round2Decimal = function (value) {
    if (!value) {
      return 0;
    }

    return Math.round(value * 100) / 100;
  };
  $scope.getDaysFrom2date = function (end, start) {
    if (!end || !start) {
      return 0;
    }

    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / Masterdata.masterdata.DAY_IN_MILLISECONDS);
  };

  $scope.getEconomicYearsOfJapan = function () {
    // economic year from: 4/1 - 31/3 next year
    var minYear = 2021;
    var today = new Date();
    var currentYear = today.getFullYear();
    var currentMonth = today.getMonth() + 1;

    if ([1, 2, 3].indexOf(currentMonth) !== -1) {
      currentYear -= 1;
    }

    var years = [];
    for (var y = currentYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  };

  $scope.padding = function (target) {
    return ('00' + target).slice(-2);
  };

  $scope.getDayOfWeek = function (date) {
    var days = [
      $filter('translate')('common.sunday'),
      $filter('translate')('common.monday'),
      $filter('translate')('common.tuesday'),
      $filter('translate')('common.wednesday'),
      $filter('translate')('common.thursday'),
      $filter('translate')('common.friday'),
      $filter('translate')('common.saturday')
    ];
    date = moment(date);
    return days[date.weekday()];
  };

  function initSocketClient() {
    if ($scope.Authentication && $scope.Authentication.user) {
      var options = {
        transports: ['polling'], secure: true,
        reconnection: true,
        reconnectionDelay: 500
      };
      var socketClient = io($scope.domain, options);
      return socketClient;
    }

    return null;
  }

  $scope.parseErrorMessage = function (error, errorMessage) {
    var message = (error && error.message)
      || (error && error.data && error.data.message)
      || errorMessage || $filter('translate')('common.data.failed');
    return message;
  };
}
