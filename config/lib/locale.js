'use strict';

var server_ja = require('../locales/server/ja.json'),
  server_en = require('../locales/server/en.json'),
  server_zht = require('../locales/server/zht.json'),
  server_zhs = require('../locales/server/zhs.json'),
  server_fr = require('../locales/server/fr.json'),
  server_vi = require('../locales/server/vi.json'),
  server_ko = require('../locales/server/ko.json'),
  mobile_ja = require('../locales/mobile/ja.json'),
  mobile_en = require('../locales/mobile/en.json'),
  mobile_zht = require('../locales/mobile/zht.json'),
  mobile_zhs = require('../locales/mobile/zhs.json'),
  mobile_fr = require('../locales/mobile/fr.json'),
  mobile_vi = require('../locales/mobile/vi.json'),
  mobile_ko = require('../locales/mobile/ko.json'),
  client_ja = require('../locales/client/ja.json'),
  client_en = require('../locales/client/en.json'),
  client_zht = require('../locales/client/zht.json'),
  client_zhs = require('../locales/client/zhs.json'),
  client_fr = require('../locales/client/fr.json'),
  client_vi = require('../locales/client/vi.json'),
  client_ko = require('../locales/client/ko.json'),
  HashMap = require('hashmap');

// Japanese
var JA = 'ja';
// English
var EN = 'en';
// Traditional Chinese
var ZT = 'zht';
// Simplified Chinese
var ZS = 'zhs';
// 	French
var FR = 'fr';
// Vietnamese
var VI = 'vi';
// Korean
var KO = 'ko';

var server = new HashMap();
server.set(JA, server_ja);
server.set(EN, server_en);
server.set(ZT, server_zht);
server.set(ZS, server_zhs);
server.set(FR, server_fr);
server.set(VI, server_vi);
server.set(KO, server_ko);

var mobile = new HashMap();
mobile.set(JA, mobile_ja);
mobile.set(EN, mobile_en);
mobile.set(ZT, mobile_zht);
mobile.set(ZS, mobile_zhs);
mobile.set(FR, mobile_fr);
mobile.set(VI, mobile_vi);
mobile.set(KO, mobile_ko);

var client = new HashMap();
client.set(JA, client_ja);
client.set(EN, client_en);
client.set(ZT, client_zht);
client.set(ZS, client_zhs);
client.set(FR, client_fr);
client.set(VI, client_vi);
client.set(KO, client_ko);

exports.mobile = mobile;
exports.server = server;

exports.getMobileText = function (lang, key) {
  if (!lang || (lang !== JA && lang !== EN && lang !== ZT && lang !== ZS)) {
    lang = JA;
  }
  if (!key) {
    key = 'core_error';
  }
  var data = mobile.get(lang);
  return data[key] || '';
};
exports.getServerText = function (lang, key) {
  if (!lang || (lang !== JA && lang !== EN && lang !== ZT && lang !== ZS)) {
    lang = JA;
  }
  if (!key) {
    key = 'common.server.error';
  }
  var data = server.get(lang);
  return data[key] || '';
};
exports.getClientText = function (lang, key) {
  if (!lang || (lang !== JA && lang !== EN && lang !== ZT && lang !== ZS)) {
    lang = JA;
  }
  if (!key) {
    key = 'common.server.error';
  }
  var data = client.get(lang);
  return data[key] || '';
};
