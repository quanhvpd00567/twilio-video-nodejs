(function () {
  'use strict';
  angular.module('core').filter('myParseUrl', myParseUrl);
  function myParseUrl() {
    var replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,
      replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

    return function (text) {
      if (!text) {
        return '';
      }
      text = text.replace(replacePattern1, '<a class="url" href=\'$1\' target=\'_blank\'>$1</a>');
      text = text.replace(replacePattern2, '$1<a class="url" href=\'http://$2\' target=\'_blank\'>$2</a>');

      return text;
    };
  }
}());
