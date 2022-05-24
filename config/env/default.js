'use strict';

module.exports = {
  app: {
    title: 'ふふるシステム管理システム',
    description: 'ふふるシステム',
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
    employees: {
      excel: {
        dest: './modules/employees/client/excel/',
        template: './modules/employees/client/excel/templates/export.xlsx',
        export: './modules/employees/client/excel/exports/'
      },
      img: {
        qrcode: './modules/employees/client/img/qrcode/'
      }
    },
    events: {
      excel: {
        export: './modules/events/client/excel/exports/',
        template: './modules/events/client/excel/templates/export.xlsx',
        template_export_detail: './modules/events/client/excel/templates/stamp_info_sample.xlsx'
      },
      image: {
        dest: './modules/events/client/img/',
        limits: { fileSize: 5 * 1024 * 1024 }
      }
    },
    projects: {
      image: {
        dest: './modules/projects/client/img/',
        limits: { fileSize: 5 * 1024 * 1024 }
      }
    },
    notices: {
      image: {
        dest: './modules/notices/client/img/',
        limits: { fileSize: 5 * 1024 * 1024 }
      },
      excel: {
        dest: './modules/notices/client/excel/',
        export: './modules/notices/client/excel/exports/',
        template: './modules/notices/client/excel/templates/notice_list_export.xlsx'
      }
    },
    ranks: {
      excel: {
        export: './modules/ranks/client/excels/exports/',
        template: './modules/ranks/client/excels/templates/'
      }
    },
    surveys: {
      excel: {
        export: './modules/surveys/client/excels/exports/',
        template: './modules/surveys/client/excels/templates/export.xlsx'
      }
    },
    teams: {
      excel: {
        export: './modules/teams/client/excels/exports/',
        template: './modules/teams/client/excels/templates/export.xlsx'
      }
    },
    turns: {
      excel: {
        export: './modules/turns/client/excels/exports/',
        template: './modules/turns/client/excels/templates/export.xlsx'
      }
    },
    users: {
      image: {
        dest: './modules/users/client/images/',
        limits: { fileSize: 5 * 1024 * 1024 }
      }
    },
    com_projects: {
      excel: {
        dest: './modules/com_projects/client/excel/',
        template: './modules/com_projects/client/excel/templates/export.xlsx',
        export: './modules/com_projects/client/excel/exports/'
      }
    },
    products: {
      image: {
        dest: './modules/products/client/images/',
        limits: { fileSize: 5 * 1024 * 1024 }
      }
    },
    ecommerces: {
      csv: {
        template: './modules/ecommerces/client/csv/japan_zipcode.csv'
      }
    },
    order: {
      csv: {
        exports: './modules/orders/client/exports/'
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
