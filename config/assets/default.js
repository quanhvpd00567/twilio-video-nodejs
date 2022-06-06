'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
  app: {
    title: 'ふるさとNow',
    description: 'ふるさとNow',
    keywords: 'mongodb, express, angularjs, node.js, mongoose, passport',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
  },
  client: {
    lib: {
      css: [
        // bower:css
        'public/lib/bootstrap/dist/css/bootstrap.css',
        'public/lib/font-awesome/css/font-awesome.min.css',
        'public/lib/angular-ui-notification/dist/angular-ui-notification.css',
        'public/lib/ng-dialog/css/ngDialog.min.css',
        'public/lib/ng-dialog/css/ngDialog-theme-default.min.css',
        'public/lib/angular-ui-select/dist/select.min.css',
        'public/lib/Ionicons/css/ionicons.min.css',
        // endbower
        'public/admin/css/AdminLTE.min.css',
        'public/admin/css/skins/skin-blue.min.css',
        'public/lib/bootstrap-select/dist/css/bootstrap-select.css',
        'public/admin/css/inputtag.min.css',
      ],
      js: [
        // bower:js
        'public/lib/jquery/dist/jquery.min.js',
        'public/lib/angular/angular.js',
        'public/lib/angular-sanitize/angular-sanitize.min.js',
        'public/lib/angular-i18n/angular-locale_ja-jp.js',
        'public/lib/bootstrap/dist/js/bootstrap.min.js',
        'public/lib/angular-animate/angular-animate.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
        'public/lib/angular-messages/angular-messages.js',
        'public/lib/angular-mocks/angular-mocks.js',
        'public/lib/angular-resource/angular-resource.js',
        'public/lib/angular-ui-notification/dist/angular-ui-notification.js',
        'public/lib/angular-ui-router/release/angular-ui-router.js',
        'public/lib/ng-dialog/js/ngDialog.min.js',
        'public/lib/angular-file-upload/dist/angular-file-upload.min.js',
        'public/lib/bootstrap-ui-datetime-picker/dist/datetime-picker.min.js',
        'public/lib/angular-ui-select/dist/select.min.js',
        'public/lib/lodash/lodash.js',
        'public/lib/moment/moment.js',
        'public/lib/moment/locale/ja.js',
        'public/lib/angular-moment/angular-moment.js',
        'public/lib/validator-js/validator.min.js',
        'public/lib/checklist-model/checklist-model.js',
        'public/lib/chart.js/dist/Chart.min.js',
        'public/lib/angular-chart.js/dist/angular-chart.min.js',
        // end
        'public/admin/js/adminlte.min.js',
        'public/admin/js/input-tag.min.js',
        'public/local_libs/japanese/jaconv.min.js',

        'public/lib/ngmap/build/scripts/ng-map.min.js',

        'public/lib/ckeditor/ckeditor.js',
        'public/lib/angular-ckeditor/angular-ckeditor.js',

        'public/lib/bootstrap-select/dist/js/bootstrap-select.min.js',
      ],
      tests: ['public/lib/angular-mocks/angular-mocks.js']
    },
    css: [
      'modules/*/client/{css,less,scss}/*.css'
    ],
    less: [
      'modules/*/client/less/*.less'
    ],
    sass: [
      'modules/*/client/scss/*.scss'
    ],
    js: [
      'modules/core/client/app/config.js',
      'modules/core/client/app/init.js',
      'modules/*/client/*.js',
      'modules/*/client/**/*.js'
    ],
    img: [
      'modules/**/*/img/**/*.jpg',
      'modules/**/*/img/**/*.png',
      'modules/**/*/img/**/*.gif',
      'modules/**/*/img/**/*.svg'
    ],
    views: ['modules/*/client/views/**/*.html'],
    templates: ['build/templates.js']
  },
  server: {
    gulpConfig: ['gulpfile.js'],
    allJS: ['server.js', 'config/**/*.js', 'modules/*/server/**/*.js', 'mobiles/**/*.js'],
    models: 'modules/*/server/models/**/*.js',
    routes: ['modules/!(core)/server/routes/**/*.js', 'modules/core/server/routes/**/*.js'],
    sockets: 'modules/*/server/sockets/**/*.js',
    config: ['modules/*/server/config/*.js'],
    policies: 'modules/*/server/policies/*.js',
    views: ['modules/*/server/views/*.html'],
    m_allJS: ['mobiles/**/*.js'],
    m_routes: ['mobiles/routes/*.js'],
    m_config: ['mobiles/config/*.js'],
    m_policies: ['mobiles/policies/*.js'],
    m_sockets: 'modules/sockets/*.js'
  }
};
