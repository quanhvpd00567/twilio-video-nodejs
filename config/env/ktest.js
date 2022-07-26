'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
  db: {
    uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || '127.0.0.1:27017') + '/astena-mft-ktest',
    options: {},
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  },
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'ktest',
    fileLogger: {
      directoryPath: process.cwd(),
      fileName: 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  app: {
    title: defaultEnvConfig.app.title + ' - Ktest',
    deep_link: 'astena-mft-ktest://open-app'
  },
  mailer: {
    prefix_subject: '【ふるさとNow】',
    from: 'support@fufuru-ktest.techlog.bz',
    to: 'support@fufuru-ktest.techlog.bz',
    options: {
      host: 'fufuru-ktest.techlog.bz',
      port: 587,
      secure: true,
      requireTLS: true,
      tls: {
        rejectUnauthorized: false
      },
      auth: {
        user: 'support',
        pass: '5931TCenter'
      }
    }
  },
  livereload: false,
  seedDB: {
    seed: process.env.MONGO_SEED === 'true',
    options: {
      logResults: process.env.MONGO_SEED_LOG_RESULTS !== 'false'
    },
    // Order of collections in configuration will determine order of seeding.
    // i.e. given these settings, the User seeds will be complete before
    // Article seed is performed.
    collections: [{
      model: 'User',
      docs: [{
        data: {
          username: 'admin',
          email: 'admin@localhost.com',
          name: 'システム管理者',
          first_name: 'Admin',
          last_name: 'Admin',
          password: '12345678',
          roles: ['admin'],
          nickname: 'admin'
        }
      }, {
        data: {
          username: 'ktcadmin',
          email: 'ktcadmin@localhost.com',
          name: 'システム管理者',
          first_name: 'Admin',
          last_name: 'Admin',
          password: '12345678',
          roles: ['admin'],
          gender: 'male',
          nickname: 'ktcadmin',
          is_can_config_version: true
        }
      }]
    }]
  },
  system: {
    domain: 'http://fufuru-mft-ktest.techlog.bz/',
    env: 'ktest',
    contact_email: 'dev@ktcc.co.jp'
  },
  // プッシュ通知
  firebase: {
    apiKey: 'AAAAY9eml50:APA91bGkTpdBkJkAFGPtxuFPNqkBx91FOWm46Q8Egyf5rcYldiGfD3Ok11ptKJuyJweoQ_uoqN9QeCDLypRcJTjMKeOdtGCgoy_pQb_3SKH7bOEr8XvkjRtvnXW4r7UCYGfTRNYHODqg'
  },
  veritrans: {
    ccid: 'A100000000000001069713cc',
    password: '02ed5298dc4efe31f4a10d651dbd93a5d16145325ff21b7edc182819a1a717e4',
    token_api_key: 'e2b5dfdb-3561-45e4-87ab-02c928d3b402',
    dummyRequest: 0,
    urls: {
      authorize: 'https://api.veritrans.co.jp:443/paynow/v2/Authorize/card',
      recurring_add: 'https://api.veritrans.co.jp:443/paynowid/v1/Add/recurring',
      recurring_del: 'https://api.veritrans.co.jp:443/paynowid/v1/Delete/recurring',
      update: 'https://api.veritrans.co.jp:443/paynowid/v1/Update/cardinfo',
      delete: 'https://api.veritrans.co.jp:443/paynowid/v1/Delete/cardinfo'
    }
  },
  houjin: {
    id: 'KTkKpgZK8npSM',
    hostname: 'https://api.houjin-bangou.nta.go.jp',
    path: '/4/name?',
    type: '12',
    history: '0'
  }
};
