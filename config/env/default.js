'use strict';

module.exports = {
  app: {
    title: 'ふるさとNow管理システム',
    description: 'ふるさとNow',
    keywords: '',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
  },
  db: {
    promise: global.Promise
  },
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  // DOMAIN config should be set to the fully qualified application accessible
  // URL. For example: https://www.myapp.com (including port if required).
  domain: process.env.DOMAIN,
  // Session Cookie settings
  sessionCookie: {
    // session expiration is set by default to 24 hours
    maxAge: 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: false
  },
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: process.env.SESSION_SECRET || '5931TCenter',
  // sessionKey is the cookie session name
  sessionKey: '5931TCenter',
  sessionCollection: 'sessions',
  // Lusca config
  csrf: {
    csrf: false,
    csp: false,
    xframe: 'SAMEORIGIN',
    p3p: 'ABCDEF',
    xssProtection: true
  },
  logo: 'modules/core/client/img/brand/logo.png',
  favicon: 'modules/core/client/img/brand/favicon.ico',
  illegalUsernames: ['meanjs', 'administrator', 'password', 'admin', 'user',
    'unknown', 'anonymous', 'null', 'undefined', 'api'
  ],
  // プッシュ通知
  uploads: {
    // Storage can be 'local' or 's3'
    storage: process.env.UPLOADS_STORAGE || 'local',
    users: {
      image: {
        dest: './modules/users/client/images/',
        limits: { fileSize: 5 * 1024 * 1024 }
      }
    },
    products: {
      image: {
        dest: './modules/products/client/images/',
        limits: { fileSize: 5 * 1024 * 1024 }
      }
    },
    core: {
      csv: {
        template: './modules/core/client/csv/japan_zipcode.csv'
      }
    },
    order: {
      excel: {
        exports: './modules/orders/client/exports/',
        template_munic_order: './modules/orders/client/exports/templates/order-tmp.xlsx'
      }
    }
  },
  shared: {
  },
  system: {
    // First time number
    order_default_number: 1

  }
};
