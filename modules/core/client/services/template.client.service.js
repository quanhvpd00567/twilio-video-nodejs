'use strict';

angular.module('core').service('TemplateFactory', TemplateFactory);

TemplateFactory.$inject = [];
function TemplateFactory() {
  var factory = {};
  // Common
  factory.image_view = 'image_view.html';
  factory.pdf_view = '/modules/core/client/views/modals/commons/modal-pdf.client.view.html';
  factory.confirm = 'confirm.html';
  factory.confirm_ok = 'confirm_ok.html';
  factory.text_input = 'textInput.html';
  factory.download = 'download.html';
  factory.waiting = 'waiting.html';
  factory.error_notification = 'error_notification.html';
  factory.display_setting = '/modules/core/client/views/modals/commons/modal-display.client.view.html';
  // Uploaders
  factory.img_uploader = '/modules/core/client/views/modals/uploaders/modal-uploader-img.client.view.html';
  factory.pdf_uploader = '/modules/core/client/views/modals/uploaders/modal-uploader-pdf.client.view.html';
  factory.temp_uploader = '/modules/core/client/views/modals/uploaders/modal-uploader.client.view.html';
  factory.word_uploader = '/modules/core/client/views/modals/uploaders/modal-uploader-word.client.view.html';
  factory.uploader = '/modules/core/client/views/modals/uploaders/modal-uploader.client.view.html';
  // Users
  factory.user_selection = '/modules/core/client/views/modals/users/modal-user-select.client.view.html';
  factory.list_company = 'list_company.html';
  return factory;
}
