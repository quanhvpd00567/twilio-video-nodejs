'use strict';
exports.version = '20190625100000';
exports.masterdata = {
  DAY_IN_MILLISECONDS: 1 * 24 * 60 * 60 * 1000,
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  MINIMUM_APS: 0.0001,
  MINIMUM_PPS: 0.00001,
  genders: [
    { id: 'male', value: '男性' },
    { id: 'female', value: '女性' },
    { id: 'no_answer', value: '無回答' }
  ],
  EVENT_STATUS: {
    PREPARING: 1,
    OPENING: 2,
    FINISHED: 3
  },
  event_statuses: [
    { id: 1, value: '未開催' },
    { id: 2, value: '開催中' },
    { id: 3, value: '終了' }
  ],
  // 都道府県
  prefectures: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],

  // company kind
  kind_statuses: [
    { id: 1, value: '前株' },
    { id: 2, value: '後株' },
    { id: 3, value: 'その他' }
  ],
  company_name_affix: '株式会社',
  COMPANY_KIND: {
    PREVIOUS_STOCK: 1,
    BACK_STOCK: 2,
    OTHER: 3
  },

  payment_methods: [
    { id: 1, value: '納付書' },
    { id: 2, value: '郵便振替' },
    { id: 3, value: '銀行振込' }
  ],
  PAYMENT_METHOD: {
    PAYMENT_SLIP: 1,
    POSTAL_TRANSFER: 2,
    BANK_TRANSFER: 3
  },

  sent_statuses: [
    { id: 1, value: '未送付' },
    { id: 2, value: '送付済' }
  ],
  SENT_STATUS: {
    NOT_YET: 1,
    SENT: 2
  },

  show_status: [
    { id: 1, value: '表示' },
    { id: 2, value: '非表示' }
  ],
  expire_status: [
    { id: 1, value: 'あり' },
    { id: 2, value: 'なし' }
  ],
  ship_methods: [
    { id: 1, value: '冷蔵' },
    { id: 2, value: '冷凍' },
    { id: 3, value: '常温' }
  ],
  accept_schedule_status: [
    { id: 1, value: '指定不可' },
    { id: 2, value: '指定可' }
  ],
  accept_schedule: [
    '午前中',
    '12:00 ～ 14:00',
    '14:00 ～ 16:00',
    '16:00 ～ 18:00',
    '18:00 ～ 20:00',
    '19:00 ～ 21:00',
    '20:00 ～ 21:00',
    '18:00 ～ 21:00'
  ],
  accept_noshi_status: [
    { id: 1, value: '不可' },
    { id: 2, value: '可能' }
  ],

  deadline_status: [
    { id: 1, value: '通年' },
    { id: 2, value: 'その他' }
  ],

  stock_quantity_status: [
    { id: 1, value: '常に在庫あり' },
    { id: 2, value: '限定品' }
  ],

  max_quantity_status: [
    { id: 1, value: 'なし' },
    { id: 2, value: 'あり' }
  ],

  except_place_options: [
    { id: 1, value: '離島' },
    { id: 2, value: 'その他' }
  ],

  order_payments: [
    { id: 1, value: 'クレジットカード' }
  ],
  order_apply_is_need: [
    { id: 1, value: '希望しない' },
    { id: 2, value: '希望する' }
  ],
  order_apply_sex: [
    { id: 1, value: '男' },
    { id: 2, value: '女' }
  ],

  export_status: [
    { id: 1, value: '未出力' },
    { id: 2, value: '出力済' }
  ],

  notice_targets: [
    { id: 1, value: '個人版ふるさと納税利用者全員' },
    { id: 2, value: '対象者を限定' }
  ],

  payment_statuses: [
    { id: false, value: '支払済にする' },
    { id: true, value: '支払済' }
  ],

  feature_autho_types: [
    { id: 'municipality', value: '自治体' },
    { id: 'company', value: '企業' }
  ],

  features_municipality: [
    { id: 'create_project', value: 'プロジェクトを登録する', path: 'projects/create', requestTitle: 'プロジェクトの追加登録申請があります。', requestSubtitle: '件のプロジェクトが追加されます。', requestItemName: '' },
    { id: 'update_project', value: 'プロジェクトを編集する', path: 'projects', requestTitle: 'プロジェクトの編集登録申請があります。', requestSubtitle: '件のプロジェクトが追加されます。', requestItemName: '' },
    { id: 'delete_project', value: 'プロジェクトを削除する', path: 'projects', requestTitle: 'プロジェクトの削除登録申請があります。', requestSubtitle: '件のプロジェクトが追加されます。', requestItemName: '' },

    { id: 'create_munic_member', value: '自治体メンバーを登録する', path: 'munic-members/create', isOnlyNoNeedAuthorize: true, requestTitle: '自治体メンバーの追加登録申請があります。', requestSubtitle: '件の自治体メンバーが追加されます。', requestItemName: '' },
    { id: 'update_munic_member', value: '自治体メンバーを編集する', path: 'munic-members', isOnlyNoNeedAuthorize: true, requestTitle: '自治体メンバーの編集登録申請があります。', requestSubtitle: '件の自治体メンバーが追加されます。', requestItemName: '' },
    { id: 'delete_munic_member', value: '自治体メンバーを削除する', path: 'munic-members', isOnlyNoNeedAuthorize: true, requestTitle: '自治体メンバーの削除登録申請があります。', requestSubtitle: '件の自治体メンバーが追加されます。', requestItemName: '' },

    { id: 'create_product', value: '返礼品を登録する', path: 'products/create', requestTitle: '返礼品の追加登録申請があります。', requestSubtitle: '件の返礼品が追加されます。', requestItemName: '' },
    { id: 'update_product', value: '返礼品を編集する', path: 'products', requestTitle: '返礼品の編集登録申請があります。', requestSubtitle: '件の返礼品が追加されます。', requestItemName: '' },
    // { id: 'delete_product', value: '返礼品を削除する', path: 'products', requestTitle: '返礼品の削除登録申請があります。', requestSubtitle: '件の返礼品が追加されます。', requestItemName: '' },

    { id: 'create_using', value: '寄付金の使い道を追加する', path: 'usings/create', isOnlyNoNeedAuthorize: true, requestTitle: '寄付金の使い道の追加登録申請があります。', requestSubtitle: '件の寄付金の使い道が追加されます。', requestItemName: '' },
    { id: 'update_using', value: '寄付金の使い道を編集する', path: 'usings', isOnlyNoNeedAuthorize: true, requestTitle: '寄付金の使い道の編集登録申請があります。', requestSubtitle: '件の寄付金の使い道が追加されます。', requestItemName: '' },
    { id: 'delete_using', value: '寄付金の使い道を削除する', path: 'usings', isOnlyNoNeedAuthorize: true, requestTitle: '寄付金の使い道の削除登録申請があります。', requestSubtitle: '件の寄付金の使い道が追加されます。', requestItemName: '' },

    { id: 'update_tax_payment_13', value: '個人版ふるさと納税の設定を行う', path: 'product-config', requestTitle: '個人版ふるさと納税設定登録申請があります。', requestSubtitle: '', requestItemName: '個人版ふるさと納税設定' },
    { id: 'update_tax_payment_14', value: '自治体問い合わせ先を設定する', path: 'product-config', requestTitle: '自治体問い合わせ先設定登録申請があります。', requestSubtitle: '', requestItemName: '自治体問い合わせ先設定' },

    { id: 'update_munic_info_15', value: '寄付金の納付方法を設定する', path: 'settings', requestTitle: '寄付金の納付方法設定登録申請があります。', requestSubtitle: '', requestItemName: '寄付金の納付方法設定' }
  ],

  FEATURE_MUNICIPALITY: {
    CREATE_PROJECT: 'create_project', UPDATE_PROJECT: 'update_project', DELETE_PROJECT: 'delete_project',
    CREATE_PRODUCT: 'create_product', UPDATE_PRODUCT: 'update_product', DELETE_PRODUCT: 'delete_product',
    CREATE_MUNIC_MEMBER: 'create_munic_member', UPDATE_MUNIC_MEMBER: 'update_munic_member', DELETE_MUNIC_MEMBER: 'delete_munic_member',
    CREATE_USING: 'create_using', UPDATE_USING: 'update_using', DELETE_USING: 'delete_using',
    UPDATE_TAX_PAYMENT_13: 'update_tax_payment_13', UPDATE_TAX_PAYMENT_14: 'update_tax_payment_14',
    UPDATE_MUNIC_INFO_15: 'update_munic_info_15'
  },

  features_company: [
    { id: 'create_event', value: 'イベントを登録する', path: 'events/projects' },
    { id: 'delete_event', value: 'イベントを削除する', path: 'events' },

    { id: 'create_employee', value: '参加者を登録する', path: 'employees/create' },
    { id: 'update_employee', value: '参加者を編集する', path: 'employees' },
    { id: 'delete_employee', value: '参加者を削除する', path: 'employees' },
    { id: 'download_employee', value: '参加者の一覧をダウンロードする', path: 'employees' },
    { id: 'import_employee', value: 'CSVで参加者を追加・更新する', path: 'employees/import' },

    { id: 'update_company_info', value: '企業情報を編集する', path: 'companies' },

    { id: 'create_subsidiary', value: '子会社を登録する', path: 'subsidiaries/create' },
    { id: 'update_subsidiary', value: '子会社を編集する', path: 'subsidiaries' },
    { id: 'delete_subsidiary', value: '子会社を削除する', path: 'subsidiaries' }
  ],
  company_setting_rankings: [
    { id: 'subsidiary_ranking', value: '会社ランキング' },
    { id: 'department_ranking', value: '部署ランキング' }
  ],
  event_types: [
    { id: 'floating', value: '変動制' },
    { id: 'fixed', value: '固定制' }
  ],
  event_type: {
    FLOATING: 'floating',
    FIXED: 'fixed'
  },
  usage_system: [
    { id: 2, value: 'エッグ' },
    { id: 1, value: 'Furusato 360' }
  ]
};
