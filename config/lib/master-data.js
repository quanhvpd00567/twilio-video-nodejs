'use strict';
exports.version = '20190625100000';
exports.masterdata = {
  DAY_IN_MILLISECONDS: 1 * 24 * 60 * 60 * 1000,
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],

  // 都道府県
  prefectures: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],

  export_status: [
    { id: 1, value: '未出力' },
    { id: 2, value: '出力済' }
  ],
  sel_status: [
    { id: 1, value: '販売中' },
    { id: 2, value: '受付終了' }
  ],
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
  ]
};
