'use strict';
exports.version = '1655646906413';
exports.masterdata = {
  DAY_IN_MILLISECONDS: 1 * 24 * 60 * 60 * 1000,
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],

  // 都道府県
  prefectures: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],

  // app
  sending_application_forms: [
    { id: 1, value: '希望する' }, // Yes
    { id: 2, value: '希望しない' } // No
  ],
  application_sexes: [
    { id: 1, value: '男性' }, // male
    { id: 2, value: '女性' } // female
  ],

  hideOneStopDate: '2022-06-29T03:29:00.150Z',
  sending_application_form_mark: `
ワンストップ特例制度を受けるためには、寄付を行った年の翌年1月10日までにワンストップ特例申請書を寄付先の自治体に提出する必要があります。
また、ワンストップ特例制度を利用するには、以下の条件を満たす必要があります。
  
1. 1年間の寄付先は5自治体以内である
1つの自治体に複数回寄付をしても1カウントになります。ほかに4自治体への寄付が可能です。
2. 確定申告を行う必要のない給与所得者である（年収2,000万円を超える所得者や、医療費控除等で確定申告が必要な場合、ワンストップ特例制度は使用できません）
3. 寄付毎に寄付先の自治体にワンストップ特例申請書と必要書類を合わせて提出する
※必要書類:個人番号確認および本人確認書類
`,

  application_sex_mark: `
2022年4月の法改正に伴い、ワンストップ申請をお申し込みの際、性別のご申告は不要となります。
それにより、2022年4月以降に発行されるワンストップ申請書の性別欄は削除されます。
なお、現在の仕様上、ワンストップ申請書をご希望の場合は、性別を選択してお申し込みください。
恐れ入りますが、システムの改修までご容赦いただきますようお願いいたします。
`,

  export_status: [
    { id: 1, value: '未出力' },
    { id: 2, value: '出力済' }
  ],
  sel_status: [
    { id: 1, value: '販売中' },
    { id: 2, value: '受付終了' }
  ],
  apply_needs: [
    { id: 2, value: '受付中' }, // ACCEPTING
    { id: 1, value: '受付停止' } // RECEPTION_STOP
  ],
  APPLY_NEED: {
    RECEPTION_STOP: 1,
    ACCEPTING: 2
  },
  suspension_periods: [
    { id: 1, value: 'すぐ' },
    { id: 2, value: '予約' }
  ],
  SUSPENSION_PERIOD: {
    SOON: 1,
    RESERVE: 2
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
    { id: 1, value: 'なし' },
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
  ],
  usage_system: [
    { id: 1, value: 'Furusato 360' }
  ],
  order_payments: [
    { id: 1, value: 'クレジットカード' }
  ]
};
