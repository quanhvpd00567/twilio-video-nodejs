(function () {
  'use strict';
  // Angular-ui-notification configuration
  angular.module('ui-notification').config(function (NotificationProvider) {
    NotificationProvider.setOptions({
      delay: 2000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 20,
      horizontalSpacing: 20,
      positionX: 'right',
      positionY: 'bottom'
    });
  });

  angular
    .module('core')
    // .config(loadingBarConfig)
    // .config(breadcrumbConfig)
    // .config(toastConfig)
    // .config(toolTipConfig)
    // .config(calendarCf)
    .config(httpConnectionConfig)
    .run(uibPaginationConfig)
    .run(runConfig)
    .constant('uiDatetimePickerConfig', {
      showWeeks: false,
      format: 'yyyy/MM/dd',
      dateFormat: 'yyyy/MM/dd HH:mm',
      defaultTime: '00:00:00',
      html5Types: {
        date: 'yyyy-MM-dd',
        'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
        month: 'yyyy-MM'
      },
      initialPicker: 'date',
      reOpenDefault: false,
      enableDate: true,
      enableTime: true,
      buttonBar: {
        show: true,
        now: {
          show: false,
          text: 'Now',
          cls: 'btn-sm btn-default'
        },
        today: {
          show: true,
          text: '今日',
          cls: 'btn-sm btn-default'
        },
        clear: {
          show: true,
          text: 'クリア',
          cls: 'btn-sm btn-default'
        },
        date: {
          show: true,
          text: '日付',
          cls: 'btn-sm btn-default'
        },
        time: {
          show: true,
          text: '時間',
          cls: 'btn-sm btn-default'
        },
        close: {
          show: true,
          text: '閉じる',
          cls: 'btn-sm btn-default'
        },
        cancel: {
          show: false,
          text: 'Cancel',
          cls: 'btn-sm btn-default'
        }
      },
      closeOnDateSelection: false,
      closeOnTimeNow: false,
      appendToBody: false,
      altInputFormats: [],
      ngModelOptions: {},
      saveAs: false,
      readAs: false
    });

  uibPaginationConfig.$inject = ['uibPaginationConfig'];
  function uibPaginationConfig(uibPaginationConfig) {
    uibPaginationConfig.firstText = '最初';
    uibPaginationConfig.lastText = '最後';
    uibPaginationConfig.previousText = '前';
    uibPaginationConfig.nextText = '次';
    uibPaginationConfig.maxSize = '5';
    uibPaginationConfig.boundaryLinks = 'true';
  }

  httpConnectionConfig.$inject = ['$httpProvider'];
  function httpConnectionConfig($httpProvider) {
    $httpProvider.defaults.timeout = 5000;
  }

  function runConfig(amMoment) {
    // amMoment
    amMoment.changeLocale('ja');
  }
}());
