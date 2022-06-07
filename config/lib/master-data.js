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
  ],
  simulation_donation: [
    {
      anual_salary: '300万円',
      single_income: '28,000円',
      married_only_income: '19,000円',
      married_with_child_income: '11,000円',
      couple_with_pension: '19,000円'
    },
    {
      anual_salary: '350万円',
      single_income: '34,000円',
      married_only_income: '25,000円',
      married_with_child_income: '17,000円',
      couple_with_pension: '28,000円'
    },
    {
      anual_salary: '400万円',
      single_income: '43,000円',
      married_only_income: '33,000円',
      married_with_child_income: '25,000円',
      couple_with_pension: '36,000円'
    },
    {
      anual_salary: '450万円',
      single_income: '53,000円',
      married_only_income: '41,000円',
      married_with_child_income: '32,000円',
      couple_with_pension: '45,000円'
    },
    {
      anual_salary: '500万円',
      single_income: '61,000円',
      married_only_income: '49,000円',
      married_with_child_income: '40,000円',
      couple_with_pension: '59,000円'
    },
    {
      anual_salary: '550万円',
      single_income: '70,000円',
      married_only_income: '61,000円',
      married_with_child_income: '49,000円',
      couple_with_pension: '68,000円'
    },
    {
      anual_salary: '600万円',
      single_income: '77,000円',
      married_only_income: '68,000円',
      married_with_child_income: '60,000円',
      couple_with_pension: '78,000円'
    },
    {
      anual_salary: '650万円',
      single_income: '98,000円',
      married_only_income: '76,000円',
      married_with_child_income: '68,000円',
      couple_with_pension: '100,000円'
    },
    {
      anual_salary: '700万円',
      single_income: '109,000円',
      married_only_income: '85,000円',
      married_with_child_income: '77,000円',
      couple_with_pension: '111,000円'
    },
    {
      anual_salary: '750万円',
      single_income: '120,000円',
      married_only_income: '109,000円',
      married_with_child_income: '87,000円',
      couple_with_pension: '122,000円'
    },
    {
      anual_salary: '800万円',
      single_income: '131,000円',
      married_only_income: '120,000円',
      married_with_child_income: '111,000円',
      couple_with_pension: '134,000円'
    },
    {
      anual_salary: '850万円',
      single_income: '141,000円',
      married_only_income: '130,000円',
      married_with_child_income: '120,000円',
      couple_with_pension: '146,000円'
    },
    {
      anual_salary: '900万円',
      single_income: '153,000円',
      married_only_income: '141,000円',
      married_with_child_income: '132,000円',
      couple_with_pension: '158,000円'
    },
    {
      anual_salary: '950万円',
      single_income: '165,000円',
      married_only_income: '153,000円',
      married_with_child_income: '144,000円',
      couple_with_pension: '172,000円'
    },
    {
      anual_salary: '1000万円',
      single_income: '177,000円',
      married_only_income: '165,000円',
      married_with_child_income: '156,000円',
      couple_with_pension: '185,000円'
    },
    {
      anual_salary: '1500万円',
      single_income: '384,000円',
      married_only_income: '380,000円',
      married_with_child_income: '368,000円'
    },
    {
      anual_salary: '2000万円',
      single_income: '552,000円',
      married_only_income: '546,000円',
      married_with_child_income: '534,000円'
    },
    {
      anual_salary: '3000万円',
      single_income: '1,034,000円',
      married_only_income: '1,027,000円',
      married_with_child_income: '1,013,000円'
    },
    {
      anual_salary: '5000万円',
      single_income: '2,056,000円',
      married_only_income: '2,046,000円',
      married_with_child_income: '2,031,000円'
    },
    {
      anual_salary: '1億円',
      single_income: '4,316,000円',
      married_only_income: '4,312,000円',
      married_with_child_income: '4,297,000円'
    }
  ]
};
