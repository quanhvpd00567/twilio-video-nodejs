const CONSTANTS = {
  LIMIT_ITEM_PER_PAGE_MOBILE: 5,
  HEIGHT_TO_STRIDE_RATE: 0.45, // cm
  SPEED: 4.9,
  DAY_IN_MILLISECONDS: 1 * 24 * 60 * 60 * 1000,
  UNDEFINED_VALUE: -1000,
  LIMIT: 20,
  EVENT_STATUS: {
    PREPARING: 1,
    OPENING: 2,
    FINISHED: 3
  },
  PAY_STATUS: {
    NOT_YET: 1,
    FINISHED: 2
  },
  SENT_STATUS: {
    NOT_YET: 1,
    SENT: 2
  },
  BANK_TYPE: {
    NORMAL: 1,
    IMMEDIATE: 2
  },
  PAYMENT_METHOD: {
    PAYMENT_SLIP: 1,
    POSTAL_TRANSFER: 2,
    BANK_TRANSFER: 3
  },
  MAGAZINE_TYPE: {
    COMPANY_NAME_AMOUNT: 1,
    COMPANY_NAME_ONLY: 2,
    NOT_DESIRED: 3
  },
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    NO_ANSWER: 'no_answer'
  },
  ROLE: {
    ADMIN: 'admin',
    MUNICIPALITY: 'municipality',
    LOCATION: 'location'
  },
  NOTICE_TARGET: {
    ALL: 1,
    CONDITION: 2
  },
  USER_STATUS: {
    PENDING: 1,
    CONFIRMED: 2
  },
  NOTICE_ID: {
    AT_18H: 'PS01',
    EVENT_END: 'PS02',
    EVENT_OPENING_SILENT: 'PS03',
    CMS_NOTICE: 'PS13',
    NEW_VERSION_APP_NOTICE: 'PS14'
  },
  KINDES: {
    PRE_STOCK: 1,
    SUB_STOCK: 2,
    OTHER: 3
  },
  POINT_LOG_TYPE: {
    ACQUISITION: 1,
    USE: 2,
    EXPIRATION: 3
  },
  UPDATE_APP_TYPE: {
    OPTIONAL: 1,
    REQUIRED: 2
  },
  SELL_STATUS: {
    ON_SALE: 1,
    END_SALE: 2
  },
  TRANSACTION_STATUS: {
    SUCCESS: 1,
    FAILED: 2
  },
  V_RESULT_CODES_SUCCESS: {
    CODE_1: 'A001',
    CODE_2: 'A004'
  },
  CONFIG_SET_TYPE: {
    PPS: 'pps',
    APS: 'aps'
  },
  FEATURE_AUTHORIZED_TYPE: {
    MUNICIPALITY: 'municipality',
    COMPANY: 'company'
  },
  REQUEST_ITEM_STATUS: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    CLOSED: 'closed'
  },
  REQUEST_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },
  COMPANY_SETTING_RANKING: {
    SUBSIDIARY_RANKING: 'subsidiary_ranking',
    DEPARTMENT_RANKING: 'department_ranking'
  },
  EVENT_TYPE: {
    FLOATING: 'floating',
    FIXED: 'fixed'
  }
};

module.exports = Object.freeze(CONSTANTS);
