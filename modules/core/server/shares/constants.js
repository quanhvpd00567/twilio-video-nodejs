const CONSTANTS = {
  LIMIT_ITEM_PER_PAGE_MOBILE: 5,
  HEIGHT_TO_STRIDE_RATE: 0.45, // cm
  SPEED: 4.9,
  DAY_IN_MILLISECONDS: 1 * 24 * 60 * 60 * 1000,
  UNDEFINED_VALUE: -1000,
  LIMIT: 20,

  ROLE: {
    ADMIN: 'admin',
    MUNICIPALITY: 'municipality',
    LOCATION: 'location'
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
  }
};

module.exports = Object.freeze(CONSTANTS);
