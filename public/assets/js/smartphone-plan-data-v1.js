(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.LQV_PLAN_DATA = data;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  return {
    version: '1.1.0',
    checkedAt: '2026-09-15',
    disclosure: 'おすすめ順位は料金・データ量・通話・サポートなどの回答だけで算出し、広告報酬の有無や金額は採点に使用しません。',
    brands: {
      rakuten: {
        name: '楽天モバイル',
        networkType: 'mno',
        support: 4,
        officialUrl: 'https://network.mobile.rakuten.co.jp/fee/saikyo-plan/detail/',
        application: {
          type: 'affiliate',
          url: 'https://ad2.trafficgate.net/t/r/109/4401/318828_398477',
          label: '楽天モバイルを公式サイトで確認',
          asp: 'TG Affiliate / LinkShare',
          status: 'ACTIVE_ASP'
        },
        notes: ['データ利用量に応じて月額が変動', 'Rakuten Link利用時は対象の国内通話が無料。対象外番号等あり'],
        sourceLabel: '楽天モバイル公式料金ページ'
      },
      ahamo: {
        name: 'ahamo',
        networkType: 'mno-online',
        support: 2,
        officialUrl: 'https://faq.ahamo.com/faq/show/2?category_id=1&site_domain=default',
        application: {
          type: 'official',
          url: 'https://ahamo.com/',
          label: 'ahamo公式サイトで確認',
          status: 'OFFICIAL_ONLY_MVP'
        },
        notes: ['30GB・5分以内の国内通話無料が基本料金に含まれる', '大盛りオプションで合計110GB'],
        sourceLabel: 'ahamo公式FAQ'
      },
      linemo: {
        name: 'LINEMO',
        networkType: 'mno-online',
        support: 1,
        officialUrl: 'https://www.linemo.jp/plan/',
        application: {
          type: 'official',
          url: 'https://www.linemo.jp/plan/',
          label: 'LINEMO公式サイトで確認',
          status: 'OFFICIAL_ONLY_MVP'
        },
        notes: ['オンライン専用', '対象のLINE利用はLINEギガフリー'],
        sourceLabel: 'LINEMO公式料金ページ'
      },
      uq: {
        name: 'UQ mobile',
        networkType: 'subbrand',
        support: 5,
        officialUrl: 'https://www.uqwimax.jp/mobile/plan/',
        application: {
          type: 'official',
          url: 'https://www.uqwimax.jp/mobile/plan/',
          label: 'UQ mobile公式サイトで確認',
          status: 'OFFICIAL_ONLY_MVP'
        },
        notes: ['店舗サポートを重視する人の候補', '自宅セット割・家族セット割・支払い方法等で条件が変わる'],
        sourceLabel: 'UQ mobile公式料金ページ'
      },
      ymobile: {
        name: 'Y!mobile',
        networkType: 'subbrand',
        support: 5,
        officialUrl: 'https://www.ymobile.jp/plan/',
        application: {
          type: 'official',
          url: 'https://www.ymobile.jp/plan/',
          label: 'Y!mobile公式サイトで確認',
          status: 'OFFICIAL_ONLY_MVP'
        },
        notes: ['店舗サポートを重視する人の候補', 'おうち割・家族割・PayPayカード割等で条件が変わる', '公式案内では2026年12月1日から月額基本料の改定予定あり'],
        sourceLabel: 'Y!mobile公式料金ページ',
        reviewBefore: '2026-11-25'
      },
      mineo: {
        name: 'mineo',
        networkType: 'mvno',
        support: 3,
        officialUrl: 'https://mineo.jp/price/mypita/',
        application: {
          type: 'affiliate',
          url: 'https://h.accesstrade.net/sp/cc?rk=0100o56u00ox0v',
          label: 'mineoを公式サイトで確認',
          asp: 'AccessTrade',
          status: 'ACTIVE_ASP'
        },
        notes: ['3GB〜50GBから選択', '混雑時の通信速度は利用環境等で変わるため速度だけで選ばない'],
        sourceLabel: 'mineo公式料金ページ'
      },
      nihontsushin: {
        name: '日本通信SIM',
        networkType: 'mvno',
        support: 1,
        officialUrl: 'https://www.nihontsushin.com/entry/index.html',
        application: {
          type: 'official',
          url: 'https://www.nihontsushin.com/entry/index.html',
          label: '日本通信SIM公式サイトで確認',
          status: 'OFFICIAL_ONLY_MVP'
        },
        notes: ['低価格を重視する人の有力候補', '申込方法や本人確認条件を公式で確認'],
        sourceLabel: '日本通信SIM公式申込ページ'
      },
      povo: {
        name: 'povo2.0',
        networkType: 'mno-online',
        support: 1,
        officialUrl: 'https://povo.jp/spec/detail/',
        application: {
          type: 'official',
          url: 'https://povo.jp/spec/',
          label: 'povo2.0公式サイトで確認',
          status: 'OFFICIAL_ONLY_MVP'
        },
        notes: ['必要なデータ量・通話をトッピングする方式', '継続利用条件やトッピング有効期間を公式で確認'],
        sourceLabel: 'povo2.0公式サービス詳細'
      }
    },
    plans: [
      { id: 'rakuten-3', brand: 'rakuten', plan: 'Rakuten最強プラン', dataGb: 3, price: 1078, calls: 'app-unlimited', callMinutes: 999, flex: 4 },
      { id: 'rakuten-20', brand: 'rakuten', plan: 'Rakuten最強プラン', dataGb: 20, price: 2178, calls: 'app-unlimited', callMinutes: 999, flex: 4 },
      { id: 'rakuten-unlimited', brand: 'rakuten', plan: 'Rakuten最強プラン', dataGb: 9999, price: 3278, calls: 'app-unlimited', callMinutes: 999, flex: 4, unlimited: true },

      { id: 'ahamo-30', brand: 'ahamo', plan: 'ahamo', dataGb: 30, price: 2970, calls: 'included', callMinutes: 5, flex: 2 },
      { id: 'ahamo-110', brand: 'ahamo', plan: 'ahamo＋大盛り', dataGb: 110, price: 4950, calls: 'included', callMinutes: 5, flex: 2 },

      { id: 'linemo-3', brand: 'linemo', plan: 'LINEMOベストプラン', dataGb: 3, price: 990, calls: 'metered', callMinutes: 0, flex: 3, lineFree: true },
      { id: 'linemo-10', brand: 'linemo', plan: 'LINEMOベストプラン', dataGb: 10, price: 2090, calls: 'metered', callMinutes: 0, flex: 3, lineFree: true },
      { id: 'linemo-30', brand: 'linemo', plan: 'LINEMOベストプランV', dataGb: 30, price: 2970, calls: 'included', callMinutes: 5, flex: 3, lineFree: true },

      { id: 'uq-5', brand: 'uq', plan: 'トクトクプラン2（5GB以下利用時）', dataGb: 5, price: 2948, calls: 'metered', callMinutes: 0, flex: 2, priceNote: '基本使用料4,048円から5GB以下利用時1,100円割引。自宅セット割・カード割等は未適用。' },
      { id: 'uq-30', brand: 'uq', plan: 'トクトクプラン2', dataGb: 30, price: 4048, calls: 'metered', callMinutes: 0, flex: 2, priceNote: '割引前の基本使用料。条件を満たすと割引あり。' },
      { id: 'uq-35', brand: 'uq', plan: 'コミコミプランバリュー', dataGb: 35, price: 3828, calls: 'included', callMinutes: 10, flex: 2 },

      { id: 'ymobile-5', brand: 'ymobile', plan: 'シンプル3 S', dataGb: 5, price: 3278, calls: 'metered', callMinutes: 0, flex: 2, priceNote: '割引前の月額基本使用料。' },
      { id: 'ymobile-30', brand: 'ymobile', plan: 'シンプル3 M', dataGb: 30, price: 4378, calls: 'metered', callMinutes: 0, flex: 2, priceNote: '割引前の月額基本使用料。' },
      { id: 'ymobile-35', brand: 'ymobile', plan: 'シンプル3 L', dataGb: 35, price: 5478, calls: 'included', callMinutes: 10, flex: 2, priceNote: '割引前の月額基本使用料。' },

      { id: 'mineo-3', brand: 'mineo', plan: 'マイピタ 3GB', dataGb: 3, price: 1298, calls: 'metered', callMinutes: 0, flex: 3 },
      { id: 'mineo-7', brand: 'mineo', plan: 'マイピタ 7GB', dataGb: 7, price: 1518, calls: 'metered', callMinutes: 0, flex: 3 },
      { id: 'mineo-15', brand: 'mineo', plan: 'マイピタ 15GB', dataGb: 15, price: 1958, calls: 'metered', callMinutes: 0, flex: 3 },
      { id: 'mineo-30', brand: 'mineo', plan: 'マイピタ 30GB', dataGb: 30, price: 2178, calls: 'metered', callMinutes: 0, flex: 3 },
      { id: 'mineo-50', brand: 'mineo', plan: 'マイピタ 50GB', dataGb: 50, price: 2948, calls: 'metered', callMinutes: 0, flex: 3 },

      { id: 'nihon-1', brand: 'nihontsushin', plan: '合理的シンプル290プラン', dataGb: 1, price: 290, calls: 'metered', callMinutes: 0, flex: 2 },
      { id: 'nihon-20', brand: 'nihontsushin', plan: '合理的みんなのプラン', dataGb: 20, price: 1390, calls: 'choice', callMinutes: 5, flex: 2, callNote: '5分かけ放題または月70分無料通話を選択' },
      { id: 'nihon-50', brand: 'nihontsushin', plan: '合理的50GBプラン', dataGb: 50, price: 2178, calls: 'choice', callMinutes: 5, flex: 2, callNote: '5分かけ放題または月70分無料通話を選択' },

      { id: 'povo-3', brand: 'povo', plan: 'povo2.0＋3GB（30日間）', dataGb: 3, price: 990, calls: 'metered', callMinutes: 0, flex: 5, topping: true },
      { id: 'povo-20', brand: 'povo', plan: 'povo2.0＋20GB（30日間）', dataGb: 20, price: 2700, calls: 'metered', callMinutes: 0, flex: 5, topping: true },
      { id: 'povo-30', brand: 'povo', plan: 'povo2.0＋30GB（30日間）', dataGb: 30, price: 2780, calls: 'metered', callMinutes: 0, flex: 5, topping: true }
    ]
  };
});
