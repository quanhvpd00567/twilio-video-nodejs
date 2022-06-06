'use strict';

var fs = require('fs');
var defaultEnvConfig = require('./default');

module.exports = {
  secure: {
    // ssl: false,
    // privateKey: './config/sslcerts/key.pem',
    // certificate: './config/sslcerts/cert.pem',
    // caBundle: './config/sslcerts/cabundle.crt'
  },
  port: process.env.PORT || 3000,
  // Binding to 127.0.0.1 is safer in production.
  host: process.env.HOST || '0.0.0.0',
  db: {
    uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || '127.0.0.1:27017') + '/astena-mft',
    options: {
      /**
      * Uncomment to enable ssl certificate based authentication to mongodb
      * servers. Adjust the settings below for your specific certificate
      * setup.
      * for connect to a replicaset, rename server:{...} to replset:{...}

      ssl: true,
      sslValidate: false,
      checkServerIdentity: false,
      sslCA: fs.readFileSync('./config/sslcerts/ssl-ca.pem'),
      sslCert: fs.readFileSync('./config/sslcerts/ssl-cert.pem'),
      sslKey: fs.readFileSync('./config/sslcerts/ssl-key.pem'),
      sslPass: '1234'

      */
    },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  },
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: process.env.LOG_FORMAT || 'combined',
    fileLogger: {
      directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
      fileName: process.env.LOG_FILE || 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  app: {
    title: defaultEnvConfig.app.title,
    deep_link: 'astena-mft://open-app'
  },
  mailer: {
    prefix_subject: '【ふるさとNow】',
    from: 'support@fufuru-tax.jp',
    to: '',
    options: {
      host: 'fufuru-tax.jp',
      port: 587,
      secure: true,
      requireTLS: true,
      tls: {
        rejectUnauthorized: false
      },
      auth: {
        user: 'support',
        pass: 'hJc9XK78'
      }
    }
  },
  seedDB: {
    seed: process.env.MONGO_SEED === 'true',
    options: {
      logResults: process.env.MONGO_SEED_LOG_RESULTS !== 'false'
    },
    collections: [{
      model: 'User',
      docs: [{
        data: {
          username: 'admin',
          email: 'admin@localhost.com',
          name: 'システム管理者',
          first_name: 'Admin',
          last_name: 'Admin',
          password: 'Passw0rd',
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
          password: 'Passw0rd',
          roles: ['admin'],
          nickname: 'ktcadmin',
          is_can_config_version: true
        }
      }]
    }]
  },
  system: {
    domain: 'https://fufuru-tax.jp/',
    env: 'prod',
    contact_email: 'inquiry@fufuru-tax.jp'
  },
  firebase: {
    apiKey: 'AAAAhsCi-rI:APA91bFTyVZGLt9a8GlCkLhW3uvxKqdlK8qdwgOe1huwskUmUn_WaSJx_vplZKSkH1E5tKuO9wgqqFAJinoDynnd_o1v-Z-0VIdxC3nSMCJbhO8dFDQ25VsGCpR0_CeIs3Xvw5yK2qm4'
  },
  veritrans: {
    ccid: 'A100000000000001049250cc',
    password: '198f1894e82205a66b8d8fdaf42865a08692e8df7d2539d2336a69474f742263',
    token_api_key: '1c6fc033-e6eb-4b04-b627-5472a21897fd',
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
