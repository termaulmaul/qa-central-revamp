/**
 * STRICT PRD PARSER - Only generates test cases from explicit PRD content
 * Rules:
 * - Do NOT invent modules
 * - Do NOT invent test cases
 * - Every test case MUST originate from PRD
 * - Every condition MUST originate from PRD
 * - Every behavior MUST originate from PRD
 */

interface PRDTestCase {
  tcId: string
  title: string
  priority: 'P0' | 'P1' | 'P2' // P0: MUST TEST, P1: SHOULD TEST, P2: COULD TEST
  behavior?: 'Positive' | 'Negative' // Happy path vs Error scenario
  testType?: 'Functional · Logic/Flow' | 'Functional · Transaction' | 'E2E' | 'API / Data Integration' | 'Security' | 'Analytics/Tracking'
  sourceReference: string // Where in PRD this came from
}

interface PriorityCriteria {
  level: 'P0' | 'P1' | 'P2'
  label: string
  type: string
  releaseStatus: string
  failureAction: string
  description: string
}

interface PRDModule {
  moduleNum: number
  name: string
  testCases: PRDTestCase[]
  sourceSection: string
}

/**
 * Priority Criteria Reference - QA Standard
 */
export const PRIORITY_CRITERIA: Record<'P0' | 'P1' | 'P2', PriorityCriteria> = {
  P0: {
    level: 'P0',
    label: 'MUST TEST · KRITIS',
    type: 'CRITICAL',
    releaseStatus: '100% Wajib Lulus untuk Rilis',
    failureAction: 'Hotfix langsung. Hentikan rilis.',
    description: 'Core functionality yang HARUS berfungsi untuk release. Tidak ada workaround.',
  },
  P1: {
    level: 'P1',
    label: 'SHOULD TEST · PENTING',
    type: 'HIGH',
    releaseStatus: 'Wajib Lulus kecuali ada persetujuan PM',
    failureAction: 'Perbaiki di sprint ini. Tunda rilis fitur terkait.',
    description: 'Fitur penting dengan impact tinggi. Dapat di-defer dengan approval khusus.',
  },
  P2: {
    level: 'P2',
    label: 'COULD TEST · TAMBAHAN',
    type: 'MEDIUM',
    releaseStatus: 'Toleransi kegagalan tinggi',
    failureAction: 'Log bug di Jira, jadwalkan untuk sprint backlog berikutnya.',
    description: 'Fitur tambahan atau edge case. Dapat di-skip jika time constraint.',
  },
}

/**
 * Parse User Stories directly to generate test cases
 * Source: PRD section "User Stories"
 */
function parseUserStories(): PRDModule[] {
  const userStoriesModule: PRDModule = {
    moduleNum: 1,
    name: 'User Access & Navigation',
    testCases: [
      {
        tcId: 'TC-001',
        title: 'Verify Stock Screener can be opened when user navigates from Market page',
        priority: 'P0',
        sourceReference: 'User Story: "Sebagai retail investor, saya ingin membuka Stock Screener dari halaman Market"',
      },
      {
        tcId: 'TC-002',
        title: 'Verify criteria selection is possible when user opens Stock Screener',
        priority: 'P0',
        sourceReference: 'User Story: "dan menyaring saham dengan kriteria yang saya pilih"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const basicFilterModule: PRDModule = {
    moduleNum: 2,
    name: 'Basic Filtering (Price, Volume, Change, Market Cap, Sector)',
    testCases: [
      {
        tcId: 'TC-003',
        title: 'Verify basic filters can be applied when user selects price, volume, percentage change, market cap, or sector',
        priority: 'P1',
        sourceReference: 'User Story: "saya ingin memakai filter dasar (harga, volume, % perubahan, market cap, sektor) berbasis rentang min–max"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const fundamentalFilterModule: PRDModule = {
    moduleNum: 3,
    name: 'Fundamental Filtering (PER, PBV, ROE, Growth, DER, Dividend Yield)',
    testCases: [
      {
        tcId: 'TC-004',
        title: 'Verify fundamental metrics filtering is available when user wants to filter by PER, PBV, ROE, EPS/revenue growth, DER, or dividend yield',
        priority: 'P1',
        sourceReference: 'User Story: "saya ingin menyaring berdasarkan fundamental (PER, PBV, ROE, EPS/revenue growth, DER, dividend yield) untuk menilai kualitas emiten"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const technicalFilterModule: PRDModule = {
    moduleNum: 4,
    name: 'Technical Filtering (MA, RSI, MACD, Volume, Foreign Flow)',
    testCases: [
      {
        tcId: 'TC-005',
        title: 'Verify technical indicators filtering is available when user wants to filter by MA, golden/death cross, RSI, MACD, volume spike, foreign net buy/sell, ATR, beta, or support/resistance',
        priority: 'P1',
        sourceReference: 'User Story: "saya ingin menyaring berdasarkan teknikal (MA, golden/death cross, RSI, MACD, volume spike, foreign net buy/sell, ATR, beta, support/resistance)"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const presetModule: PRDModule = {
    moduleNum: 5,
    name: 'Preset Strategy Selection',
    testCases: [
      {
        tcId: 'TC-006',
        title: 'Verify preset strategies are available when user wants to screen without building filters manually',
        priority: 'P1',
        sourceReference: 'User Story: "Sebagai user non-advanced, saya ingin memakai preset strategi tanpa menyusun filter sendiri"',
      },
      {
        tcId: 'TC-007',
        title: 'Verify preset can be saved when user creates and saves a preset',
        priority: 'P1',
        sourceReference: 'User Story: "dan menyimpannya sebagai preset saya"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const customScreenerModule: PRDModule = {
    moduleNum: 6,
    name: 'Custom Screener Creation & Reuse',
    testCases: [
      {
        tcId: 'TC-008',
        title: 'Verify custom multi-condition screener can be created when user builds and saves custom criteria',
        priority: 'P1',
        sourceReference: 'User Story: "Sebagai user advanced, saya ingin membuat & menyimpan screener kustom multi-kondisi dan memakainya ulang"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const resultTableModule: PRDModule = {
    moduleNum: 7,
    name: 'Result Table, Sorting & Navigation',
    testCases: [
      {
        tcId: 'TC-009',
        title: 'Verify result table displays ticker, last price, change nominal+%, and volume when screening completes',
        priority: 'P1',
        sourceReference: 'User Story: "saya ingin melihat tabel hasil (ticker, harga terakhir, perubahan nominal+%, volume)"',
      },
      {
        tcId: 'TC-010',
        title: 'Verify results can be sorted when user selects a column',
        priority: 'P1',
        sourceReference: 'User Story: "mengurutkan per kolom"',
      },
      {
        tcId: 'TC-011',
        title: 'Verify Stock Detail opens when user clicks result row',
        priority: 'P1',
        sourceReference: 'User Story: "dan klik baris → Stock Detail"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const backtestModule: PRDModule = {
    moduleNum: 8,
    name: 'Backtest & Performance Analysis',
    testCases: [
      {
        tcId: 'TC-012',
        title: 'Verify backtest can be executed when user backtests screening results as a basket strategy',
        priority: 'P1',
        sourceReference: 'User Story: "Sebagai user, saya ingin mem-backtest hasil screening sebagai satu basket strategi dan melihat kinerjanya"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const dataTypeModule: PRDModule = {
    moduleNum: 9,
    name: 'Real-time vs Delayed Data Selection',
    testCases: [
      {
        tcId: 'TC-013',
        title: 'Verify real-time or delayed data can be selected when user has appropriate license and login status',
        priority: 'P1',
        sourceReference: 'User Story: "saya ingin memilih data real-time (premium) atau delayed (free) sesuai lisensi & status login"',
      },
    ],
    sourceSection: 'User Stories',
  }

  const stateI18nModule: PRDModule = {
    moduleNum: 10,
    name: 'UI States, Localization & Disclaimer',
    testCases: [
      {
        tcId: 'TC-014',
        title: 'Verify empty, loading, and error states are displayed without dead end',
        priority: 'P1',
        sourceReference: 'User Story: "saya ingin state empty / loading / error"',
      },
      {
        tcId: 'TC-015',
        title: 'Verify all text is available in English and Indonesian',
        priority: 'P1',
        sourceReference: 'User Story: "dwibahasa (EN/ID)"',
      },
      {
        tcId: 'TC-016',
        title: 'Verify disclaimer is displayed clearly',
        priority: 'P1',
        sourceReference: 'User Story: "dan disclaimer data yang jelas"',
      },
    ],
    sourceSection: 'User Stories',
  }

  return [
    userStoriesModule,
    basicFilterModule,
    fundamentalFilterModule,
    technicalFilterModule,
    presetModule,
    customScreenerModule,
    resultTableModule,
    backtestModule,
    dataTypeModule,
    stateI18nModule,
  ]
}

/**
 * Parse Use Cases (Feature List) to generate additional test cases
 * Source: PRD section "Use Cases (Feature List)"
 */
function parseUseCases(): PRDModule[] {
  const modules: PRDModule[] = []

  // F1 — Popular (Fundamental) Screener
  modules.push({
    moduleNum: 11,
    name: 'Popular Screener - Fundamental Data Display',
    testCases: [
      {
        tcId: 'TC-017',
        title: 'Verify fundamental data list is displayed when user opens Popular Screener',
        priority: 'P0',
        sourceReference: 'F1: "User dapat melihat daftar saham beserta data fundamental (sektor, industri, market cap, P/E ratio yearly & quarterly, price per lot, day change % & Rp, net income, dividend)"',
      },
      {
        tcId: 'TC-018',
        title: 'Verify stock search is possible through Search stock column',
        priority: 'P1',
        sourceReference: 'F1: "User dapat mencari saham melalui kolom Search stock"',
      },
      {
        tcId: 'TC-019',
        title: 'Verify Stock Detail opens when user clicks stock row',
        priority: 'P1',
        sourceReference: 'F1: "User dapat klik baris saham untuk melihat detail fundamentalnya"',
      },
    ],
    sourceSection: 'Use Cases - F1',
  })

  // F2 — Add Filter (Max. 10) — Fundamental
  modules.push({
    moduleNum: 12,
    name: 'Add Filter - Fundamental Criteria',
    testCases: [
      {
        tcId: 'TC-020',
        title: 'Verify filters can be added up to maximum 10 when user uses Add Filter builder',
        priority: 'P1',
        sourceReference: 'F2: "User dapat menambahkan filter (maksimal 10) melalui builder Add Filter"',
      },
      {
        tcId: 'TC-021',
        title: 'Verify field filter selection is available for Sector, Industry, Market Cap, P/E Ratio (yearly), P/E Ratio (quarterly), Price per Lot, Day Change (%), Day Change (Rp)',
        priority: 'P1',
        sourceReference: 'F2: "User dapat memilih field filter: Sector, Industry, Market Cap, P/E Ratio (yearly), P/E Ratio (quarterly), Price per Lot, Day Change (%), Day Change (Rp)"',
      },
      {
        tcId: 'TC-022',
        title: 'Verify min-max range can be entered for numeric filters and values for Sector/Industry',
        priority: 'P1',
        sourceReference: 'F2: "User dapat mengisi rentang min–max untuk filter numerik dan memilih nilai untuk Sector/Industry"',
      },
      {
        tcId: 'TC-023',
        title: 'Verify filter can be deleted when user removes a filter',
        priority: 'P1',
        sourceReference: 'F2: "User dapat menghapus filter"',
      },
      {
        tcId: 'TC-024',
        title: 'Verify active filter count is displayed on badge',
        priority: 'P2',
        sourceReference: 'F2: "melihat jumlah filter aktif pada badge"',
      },
    ],
    sourceSection: 'Use Cases - F2',
  })

  // F3 — Technical Screener — Preset
  modules.push({
    moduleNum: 13,
    name: 'Technical Preset Selection',
    testCases: [
      {
        tcId: 'TC-025',
        title: 'Verify technical preset strategies are available for selection including RSI Oversold, RSI Overbought, MACD Bullish, Stoch Oversold, Volume Surge, Strong Trend, MACD Crossover',
        priority: 'P1',
        sourceReference: 'F3: "User dapat memilih preset strategi teknikal siap pakai (mis. RSI Oversold, RSI Overbought, MACD Bullish, Stoch Oversold, Volume Surge, Strong Trend, MACD Crossover)"',
      },
      {
        tcId: 'TC-026',
        title: 'Verify preset list can be scrolled to view additional presets',
        priority: 'P2',
        sourceReference: 'F3: "User dapat menggeser (scroll) daftar preset untuk melihat preset lainnya"',
      },
    ],
    sourceSection: 'Use Cases - F3',
  })

  // F4 — Custom Preset (Save / Rename / Delete)
  modules.push({
    moduleNum: 14,
    name: 'Custom Preset Management',
    testCases: [
      {
        tcId: 'TC-027',
        title: 'Verify custom preset can be saved when user saves condition combination with Save preset button',
        priority: 'P1',
        sourceReference: 'F4: "User dapat menyimpan kombinasi kondisi sebagai preset sendiri melalui tombol Save preset"',
      },
      {
        tcId: 'TC-028',
        title: 'Verify preset name can be provided when user saves a preset',
        priority: 'P1',
        sourceReference: 'F4: "User dapat memberi nama preset saat menyimpan"',
      },
      {
        tcId: 'TC-029',
        title: 'Verify preset name can be changed when user renames a preset',
        priority: 'P1',
        sourceReference: 'F4: "User dapat mengganti nama (rename) preset"',
      },
      {
        tcId: 'TC-030',
        title: 'Verify preset can be deleted when user deletes a preset',
        priority: 'P1',
        sourceReference: 'F4: "User dapat menghapus (delete) preset"',
      },
      {
        tcId: 'TC-031',
        title: 'Verify saved preset persists across sessions',
        priority: 'P0',
        sourceReference: 'F4: "Preset tersimpan antar sesi"',
      },
    ],
    sourceSection: 'Use Cases - F4',
  })

  // F5 — Condition Builder (Technical)
  modules.push({
    moduleNum: 15,
    name: 'Technical Condition Builder',
    testCases: [
      {
        tcId: 'TC-032',
        title: 'Verify technical conditions can be built up to maximum 3 when user constructs conditions',
        priority: 'P1',
        sourceReference: 'F5: "User dapat menyusun kondisi teknikal (maksimal 3)"',
      },
      {
        tcId: 'TC-033',
        title: 'Verify field selection is available for RSI, MACD Line/Signal/Hist, Stoch %K/%D, SMA 20/50/200, ADX, Volume, OBV, Price, Change %',
        priority: 'P1',
        sourceReference: 'F5: "memilih field (RSI, MACD Line/Signal/Hist, Stoch %K/%D, SMA 20/50/200, ADX, Volume, OBV, Price, Change %)"',
      },
      {
        tcId: 'TC-034',
        title: 'Verify operators are available including <, >, <=, >=, =',
        priority: 'P1',
        sourceReference: 'F5: "operator (<, >, <=, >=, =)"',
      },
      {
        tcId: 'TC-035',
        title: 'Verify values can be entered as numbers or field references when building conditions',
        priority: 'P1',
        sourceReference: 'F5: "nilai (angka atau field lain)"',
      },
      {
        tcId: 'TC-036',
        title: 'Verify conditions can be added or removed before running screening',
        priority: 'P1',
        sourceReference: 'F5: "User dapat menambah/menghapus kondisi"',
      },
      {
        tcId: 'TC-037',
        title: 'Verify screening runs when user clicks Run Screen',
        priority: 'P1',
        sourceReference: 'F5: "lalu klik Run Screen"',
      },
    ],
    sourceSection: 'Use Cases - F5',
  })

  // F6 — Universe (Index / Watchlist / Portfolio)
  modules.push({
    moduleNum: 16,
    name: 'Universe Selection',
    testCases: [
      {
        tcId: 'TC-038',
        title: 'Verify universe can be selected through Index, Watchlist, or Portfolio sub-tabs',
        priority: 'P1',
        sourceReference: 'F6: "User dapat memilih universe melalui sub-tab Index, Watchlist, atau Portfolio"',
      },
      {
        tcId: 'TC-039',
        title: 'Verify specific index lists can be selected including LQ45, IDX30, IDX80, KOMPAS100, IDX Energy/Financials/Consumer, JII, IDXBUMN20',
        priority: 'P1',
        sourceReference: 'F6: "User dapat memilih daftar spesifik dari dropdown (mis. LQ45, IDX30, IDX80, KOMPAS100, IDX Energy/Financials/Consumer, JII, IDXBUMN20 untuk Index)"',
      },
      {
        tcId: 'TC-040',
        title: 'Verify watchlist options are available for selection',
        priority: 'P1',
        sourceReference: 'F6: "beberapa watchlist untuk Watchlist"',
      },
    ],
    sourceSection: 'Use Cases - F6',
  })

  // F7 — Basic & Fundamental Filtering
  modules.push({
    moduleNum: 17,
    name: 'Comprehensive Filtering Options',
    testCases: [
      {
        tcId: 'TC-041',
        title: 'Verify stocks can be filtered by price, volume, percentage change, value traded, market cap based on min-max range',
        priority: 'P1',
        sourceReference: 'F7: "User dapat menyaring saham berdasarkan harga, volume, % change, value traded, market cap, sektor/industri, serta metrik fundamental (PER, PBV, ROE, ROA, margin, growth, DER, current/quick ratio, dividend yield) — berbasis rentang min–max"',
      },
      {
        tcId: 'TC-042',
        title: 'Verify stocks can be filtered by sector and industry based on min-max range',
        priority: 'P1',
        sourceReference: 'F7: "User dapat menyaring saham berdasarkan sektor/industri"',
      },
      {
        tcId: 'TC-043',
        title: 'Verify stocks can be filtered by fundamental metrics PER, PBV, ROE, ROA, margin, growth, DER, current/quick ratio, dividend yield based on min-max range',
        priority: 'P1',
        sourceReference: 'F7: "metrik fundamental (PER, PBV, ROE, ROA, margin, growth, DER, current/quick ratio, dividend yield) — berbasis rentang min–max"',
      },
    ],
    sourceSection: 'Use Cases - F7',
  })

  // F8 — Technical Indicators
  modules.push({
    moduleNum: 18,
    name: 'Technical Indicator Filtering',
    testCases: [
      {
        tcId: 'TC-044',
        title: 'Verify stocks can be filtered by moving averages MA 5/20/50/200 when user applies technical indicators',
        priority: 'P1',
        sourceReference: 'F8: "User dapat menyaring berdasarkan indikator teknikal (MA 5/20/50/200, Golden/Death Cross, RSI, MACD, Stochastic, ATR, Beta, volume spike, Foreign Net Buy/Sell, support/resistance)"',
      },
      {
        tcId: 'TC-045',
        title: 'Verify stocks can be filtered by Golden/Death Cross indicator',
        priority: 'P1',
        sourceReference: 'F8: "Golden/Death Cross"',
      },
      {
        tcId: 'TC-046',
        title: 'Verify stocks can be filtered by RSI indicator',
        priority: 'P1',
        sourceReference: 'F8: "RSI"',
      },
      {
        tcId: 'TC-047',
        title: 'Verify stocks can be filtered by MACD indicator',
        priority: 'P1',
        sourceReference: 'F8: "MACD"',
      },
      {
        tcId: 'TC-048',
        title: 'Verify stocks can be filtered by Stochastic indicator',
        priority: 'P1',
        sourceReference: 'F8: "Stochastic"',
      },
      {
        tcId: 'TC-049',
        title: 'Verify stocks can be filtered by ATR indicator',
        priority: 'P1',
        sourceReference: 'F8: "ATR"',
      },
      {
        tcId: 'TC-050',
        title: 'Verify stocks can be filtered by Beta indicator',
        priority: 'P1',
        sourceReference: 'F8: "Beta"',
      },
      {
        tcId: 'TC-051',
        title: 'Verify stocks can be filtered by volume spike indicator',
        priority: 'P1',
        sourceReference: 'F8: "volume spike"',
      },
      {
        tcId: 'TC-052',
        title: 'Verify stocks can be filtered by Foreign Net Buy/Sell indicator',
        priority: 'P1',
        sourceReference: 'F8: "Foreign Net Buy/Sell"',
      },
      {
        tcId: 'TC-053',
        title: 'Verify stocks can be filtered by support/resistance indicator',
        priority: 'P1',
        sourceReference: 'F8: "support/resistance"',
      },
    ],
    sourceSection: 'Use Cases - F8',
  })

  // F9 — Result Table & Pagination
  modules.push({
    moduleNum: 19,
    name: 'Result Display, Pagination & Navigation',
    testCases: [
      {
        tcId: 'TC-054',
        title: 'Verify result table displays ticker, last price, change nominal+%, volume, and optional indicators',
        priority: 'P1',
        sourceReference: 'F9: "User dapat melihat tabel/daftar hasil (ticker, last price, change nominal+%, volume, indikator opsional)"',
      },
      {
        tcId: 'TC-055',
        title: 'Verify results can be sorted by column',
        priority: 'P1',
        sourceReference: 'F9: "User dapat mengurutkan (sort) per kolom"',
      },
      {
        tcId: 'TC-056',
        title: 'Verify maximum 10 stocks are displayed per page',
        priority: 'P1',
        sourceReference: 'F9: "User dapat melihat maksimum 10 ticker per halaman"',
      },
      {
        tcId: 'TC-057',
        title: 'Verify user can navigate between pages using pagination',
        priority: 'P1',
        sourceReference: 'F9: "dan berpindah halaman (pagination)"',
      },
      {
        tcId: 'TC-058',
        title: 'Verify Stock Detail opens when user clicks result row',
        priority: 'P1',
        sourceReference: 'F9: "User dapat klik baris hasil untuk membuka Stock Detail"',
      },
    ],
    sourceSection: 'Use Cases - F9',
  })

  // F10 — Period
  modules.push({
    moduleNum: 20,
    name: 'Screening Period Selection',
    testCases: [
      {
        tcId: 'TC-059',
        title: 'Verify screening period can be selected for 1D, 1W, 1M, 3M, 6M, or 1Y',
        priority: 'P1',
        sourceReference: 'F10: "User dapat memilih periode data screening (1D / 1W / 1M / 3M / 6M / 1Y)"',
      },
    ],
    sourceSection: 'Use Cases - F10',
  })

  // F11 — Backtest (basket hasil screening)
  modules.push({
    moduleNum: 21,
    name: 'Backtest Execution & Basket Viewing',
    testCases: [
      {
        tcId: 'TC-060',
        title: 'Verify backtest can be initiated when user clicks Backtest button',
        priority: 'P1',
        sourceReference: 'F11: "User dapat klik tombol Backtest untuk membacktest hasil screening"',
      },
      {
        tcId: 'TC-061',
        title: 'Verify screening results are backtested as a single equal-weight basket portfolio',
        priority: 'P1',
        sourceReference: 'F11: "sebagai satu basket portfolio (equal-weight)"',
      },
      {
        tcId: 'TC-062',
        title: 'Verify basket contains all screened stocks when backtest is opened',
        priority: 'P1',
        sourceReference: 'F11: "User dapat melihat basket berisi seluruh saham hasil screening"',
      },
    ],
    sourceSection: 'Use Cases - F11',
  })

  // F12 — Adjust Basket
  modules.push({
    moduleNum: 22,
    name: 'Basket Customization During Backtest',
    testCases: [
      {
        tcId: 'TC-063',
        title: 'Verify stock can be removed from basket when user deletes a stock',
        priority: 'P1',
        sourceReference: 'F12: "User dapat menghapus saham dari basket"',
      },
      {
        tcId: 'TC-064',
        title: 'Verify stock can be added to basket from universe when user adds a stock',
        priority: 'P1',
        sourceReference: 'F12: "User dapat menambahkan saham dari universe"',
      },
      {
        tcId: 'TC-065',
        title: 'Verify basket can be reset to screening results when user clicks reset',
        priority: 'P1',
        sourceReference: 'F12: "User dapat klik reset ke hasil screening untuk mengembalikan basket"',
      },
    ],
    sourceSection: 'Use Cases - F12',
  })

  // F13 — Adjust Strategi Backtest
  modules.push({
    moduleNum: 23,
    name: 'Backtest Strategy Adjustment',
    testCases: [
      {
        tcId: 'TC-066',
        title: 'Verify backtest strategy is automatically derived from screening conditions',
        priority: 'P1',
        sourceReference: 'F13: "User dapat melihat strategi backtest yang otomatis diambil dari kondisi screening"',
      },
      {
        tcId: 'TC-067',
        title: 'Verify strategy conditions can be edited with maximum 3 conditions including add, modify, or delete',
        priority: 'P1',
        sourceReference: 'F13: "User dapat mengeditnya (tambah/ubah/hapus kondisi, maksimal 3)"',
      },
      {
        tcId: 'TC-068',
        title: 'Verify entry occurs when all conditions are met',
        priority: 'P1',
        sourceReference: 'F13: "Entry saat semua kondisi terpenuhi"',
      },
      {
        tcId: 'TC-069',
        title: 'Verify exit occurs when conditions are no longer met',
        priority: 'P1',
        sourceReference: 'F13: "exit saat tidak lagi terpenuhi"',
      },
    ],
    sourceSection: 'Use Cases - F13',
  })

  // F14 — Backtest Params & Results
  modules.push({
    moduleNum: 24,
    name: 'Backtest Parameters & Performance Metrics',
    testCases: [
      {
        tcId: 'TC-070',
        title: 'Verify backtest period can be selected for 6M, 1Y, 3Y, or 5Y',
        priority: 'P1',
        sourceReference: 'F14: "User dapat memilih periode backtest (6M / 1Y / 3Y / 5Y)"',
      },
      {
        tcId: 'TC-071',
        title: 'Verify initial capital can be entered when user fills initial investment amount',
        priority: 'P1',
        sourceReference: 'F14: "dan mengisi modal awal"',
      },
      {
        tcId: 'TC-072',
        title: 'Verify backtest runs when user clicks Run backtest',
        priority: 'P1',
        sourceReference: 'F14: "lalu klik Run backtest"',
      },
      {
        tcId: 'TC-073',
        title: 'Verify statistics are displayed including Total Return, Buy & Hold, Final Equity, Trades count, Win Rate, Profit Factor, Max Drawdown, Avg Trade',
        priority: 'P1',
        sourceReference: 'F14: "User dapat melihat statistik (Total Return, Buy & Hold, Final Equity, # Trades, Win Rate, Profit Factor, Max Drawdown, Avg Trade)"',
      },
      {
        tcId: 'TC-074',
        title: 'Verify equity curve is displayed comparing strategy vs buy & hold',
        priority: 'P1',
        sourceReference: 'F14: "dan equity curve (strategi vs buy & hold)"',
      },
    ],
    sourceSection: 'Use Cases - F14',
  })

  // F15 — Detail Transaksi per Saham
  modules.push({
    moduleNum: 25,
    name: 'Per-Stock Transaction Details',
    testCases: [
      {
        tcId: 'TC-075',
        title: 'Verify per-stock details display trade count, win rate, return, and contribution',
        priority: 'P1',
        sourceReference: 'F15: "User dapat melihat rincian per saham (jumlah trade, win rate, return, kontribusi)"',
      },
      {
        tcId: 'TC-076',
        title: 'Verify transaction details open when user clicks stock row showing entry/exit date, price, and per-trade return',
        priority: 'P1',
        sourceReference: 'F15: "User dapat klik baris saham untuk melihat detail transaksi (tanggal & harga entry/exit, return per trade)"',
      },
    ],
    sourceSection: 'Use Cases - F15',
  })

  // F16 — Export / Download Hasil
  modules.push({
    moduleNum: 26,
    name: 'Export Functionality',
    testCases: [
      {
        tcId: 'TC-077',
        title: 'Verify screening results can be downloaded as CSV or Excel file for further analysis',
        priority: 'P2',
        sourceReference: 'F16: "User dapat melakukan download hasil screening sebagai file (CSV / Excel) untuk analisis lanjutan"',
      },
      {
        tcId: 'TC-078',
        title: 'Verify export is available for Premium subscription only',
        priority: 'P1',
        sourceReference: 'F16: "(Premium.)"',
      },
    ],
    sourceSection: 'Use Cases - F16',
  })

  // F17 — Save & Load Screener
  modules.push({
    moduleNum: 27,
    name: 'Screener Save, Load & Management',
    testCases: [
      {
        tcId: 'TC-079',
        title: 'Verify screener can be saved when user saves screener configuration',
        priority: 'P1',
        sourceReference: 'F17: "User dapat menyimpan (save)"',
      },
      {
        tcId: 'TC-080',
        title: 'Verify saved screener can be renamed when user modifies screener name',
        priority: 'P1',
        sourceReference: 'F17: "rename"',
      },
      {
        tcId: 'TC-081',
        title: 'Verify saved screener can be deleted when user removes screener',
        priority: 'P1',
        sourceReference: 'F17: "menghapus (delete)"',
      },
      {
        tcId: 'TC-082',
        title: 'Verify saved screener can be reloaded when user loads existing screener',
        priority: 'P1',
        sourceReference: 'F17: "memuat kembali (load) screener tersimpan"',
      },
      {
        tcId: 'TC-083',
        title: 'Verify saved screener persists across sessions',
        priority: 'P0',
        sourceReference: 'F17: "persist antar sesi"',
      },
    ],
    sourceSection: 'Use Cases - F17',
  })

  // F18 — Real-time / Delayed Data
  modules.push({
    moduleNum: 28,
    name: 'Data Type Selection & Status Indication',
    testCases: [
      {
        tcId: 'TC-084',
        title: 'Verify real-time data can be selected when user has Premium subscription',
        priority: 'P1',
        sourceReference: 'F18: "User dapat memilih data real-time (premium)"',
      },
      {
        tcId: 'TC-085',
        title: 'Verify delayed data can be selected when user has Free subscription',
        priority: 'P1',
        sourceReference: 'F18: "atau delayed (free)"',
      },
      {
        tcId: 'TC-086',
        title: 'Verify data type selection respects user license and login status',
        priority: 'P1',
        sourceReference: 'F18: "sesuai lisensi & status login"',
      },
      {
        tcId: 'TC-087',
        title: 'Verify data status is clearly indicated to user',
        priority: 'P1',
        sourceReference: 'F18: "status data ditandai jelas"',
      },
    ],
    sourceSection: 'Use Cases - F18',
  })

  // F19 — Alerts from Screener
  modules.push({
    moduleNum: 29,
    name: 'Alert Configuration',
    testCases: [
      {
        tcId: 'TC-088',
        title: 'Verify alert can be set when user configures notification for screener criteria',
        priority: 'P2',
        sourceReference: 'F19: "User dapat men-set alert (mis. notifikasi bila saham masuk kriteria screener tertentu)"',
      },
    ],
    sourceSection: 'Use Cases - F19',
  })

  // F20 — States, i18n & Disclaimer
  modules.push({
    moduleNum: 30,
    name: 'UI States, Localization & Disclaimers',
    testCases: [
      {
        tcId: 'TC-089',
        title: 'Verify empty state is displayed without dead end when no results are found',
        priority: 'P1',
        sourceReference: 'F20: "User dapat melihat state empty / loading / error tanpa jalan buntu"',
      },
      {
        tcId: 'TC-090',
        title: 'Verify loading state is displayed without dead end during screening',
        priority: 'P1',
        sourceReference: 'F20: "state empty / loading / error tanpa jalan buntu"',
      },
      {
        tcId: 'TC-091',
        title: 'Verify error state is displayed without dead end when screening fails',
        priority: 'P1',
        sourceReference: 'F20: "state empty / loading / error tanpa jalan buntu"',
      },
      {
        tcId: 'TC-092',
        title: 'Verify all labels and disclaimers are available in English',
        priority: 'P1',
        sourceReference: 'F20: "seluruh label & disclaimer tersedia EN & ID"',
      },
      {
        tcId: 'TC-093',
        title: 'Verify all labels and disclaimers are available in Indonesian',
        priority: 'P1',
        sourceReference: 'F20: "seluruh label & disclaimer tersedia EN & ID"',
      },
      {
        tcId: 'TC-094',
        title: 'Verify TICMI data source disclaimer is displayed on results',
        priority: 'P1',
        sourceReference: 'F20: "disclaimer sumber data (TICMI) & non-advice tampil pada hasil"',
      },
      {
        tcId: 'TC-095',
        title: 'Verify non-advice disclaimer is displayed on results',
        priority: 'P1',
        sourceReference: 'F20: "non-advice tampil pada hasil"',
      },
      {
        tcId: 'TC-096',
        title: 'Verify non-advice disclaimer is displayed on preset',
        priority: 'P1',
        sourceReference: 'F20: "non-advice tampil pada preset"',
      },
      {
        tcId: 'TC-097',
        title: 'Verify non-advice disclaimer is displayed on Backtest',
        priority: 'P1',
        sourceReference: 'F20: "non-advice tampil pada Backtest"',
      },
    ],
    sourceSection: 'Use Cases - F20',
  })

  // F21 — Feature Flag & Audit Logging
  modules.push({
    moduleNum: 31,
    name: 'Feature Flags & Audit Logging',
    testCases: [
      {
        tcId: 'TC-098',
        title: 'Verify kill switch and per-surface feature flags control feature availability',
        priority: 'P2',
        sourceReference: 'F21: "kill switch + flag per surface/preset"',
      },
      {
        tcId: 'TC-099',
        title: 'Verify screener runs are logged for analytics and audit purposes',
        priority: 'P1',
        sourceReference: 'F21: "log screener run, backtest, save/load"',
      },
      {
        tcId: 'TC-100',
        title: 'Verify backtest executions are logged with criteria, preset, and timestamp in WIB',
        priority: 'P1',
        sourceReference: 'F21: "log screener run, backtest, save/load, & interaksi (kriteria, preset, kapan WIB)"',
      },
      {
        tcId: 'TC-101',
        title: 'Verify screener save/load actions are logged for analytics and audit',
        priority: 'P1',
        sourceReference: 'F21: "log screener run, backtest, save/load"',
      },
    ],
    sourceSection: 'Use Cases - F21',
  })

  return modules
}

/**
 * Parse Backend Acceptance Criteria
 */
function parseBackendCriteria(): PRDModule[] {
  return [
    {
      moduleNum: 32,
      name: 'Data Accuracy & Consistency',
      testCases: [
        {
          tcId: 'TC-102',
          title: 'Verify fundamental data and technical indicators are accurate and consistent with IDX official data with 99.9% accuracy minimum',
          priority: 'P0',
          sourceReference: 'Backend AC: "User dapat melihat data fundamental & indikator teknikal yang akurat dan konsisten dengan data IDX resmi (akurasi ≥ 99.9%)"',
        },
        {
          tcId: 'TC-103',
          title: 'Verify price change (nominal + %) is correct according to IDX tick-size',
          priority: 'P0',
          sourceReference: 'Backend AC: "termasuk perubahan harga (nominal + %) yang benar sesuai tick-size IDX"',
        },
      ],
      sourceSection: 'Backend Acceptance Criteria',
    },
    {
      moduleNum: 33,
      name: 'Screening Performance & Scale',
      testCases: [
        {
          tcId: 'TC-104',
          title: 'Verify screening results display for any filter combination within 1 second typically and 2 seconds refresh for ≤5 active filters',
          priority: 'P1',
          sourceReference: 'Backend AC: "User dapat melihat hasil screening untuk kombinasi filter apa pun (basic/fundamental/technical/preset/custom), sudah ter-sort/rank, biasanya ≤ 1 detik (refresh ≤ 2 detik untuk ≤ 5 filter aktif)"',
        },
        {
          tcId: 'TC-105',
          title: 'Verify maximum 10 stocks per page are displayed from 900+ universe',
          priority: 'P1',
          sourceReference: 'Backend AC: "maksimum 10 saham per halaman dari 900+ emiten"',
        },
      ],
      sourceSection: 'Backend Acceptance Criteria',
    },
    {
      moduleNum: 34,
      name: 'Backtest Integrity',
      testCases: [
        {
          tcId: 'TC-106',
          title: 'Verify backtest results including equity, return, win rate, profit factor, max drawdown are consistent and without look-ahead bias',
          priority: 'P0',
          sourceReference: 'Backend AC: "User dapat melihat hasil Backtest (equity, return, win rate, profit factor, max drawdown) yang konsisten & tanpa look-ahead bias"',
        },
      ],
      sourceSection: 'Backend Acceptance Criteria',
    },
    {
      moduleNum: 35,
      name: 'Graceful Degradation with Delayed Data',
      testCases: [
        {
          tcId: 'TC-107',
          title: 'Verify delayed status is marked and screener continues running with delayed data when real-time feed fails',
          priority: 'P1',
          sourceReference: 'Backend AC: "User tahu akan melihat penanda delayed / stale — dan screener tetap berjalan dengan data delayed — bila feed real-time/fundamental gagal, bukan error buntu"',
        },
      ],
      sourceSection: 'Backend Acceptance Criteria',
    },
    {
      moduleNum: 36,
      name: 'Premium Feature Gating - Server-Side Validation',
      testCases: [
        {
          tcId: 'TC-108',
          title: 'Verify user can only access Premium features when subscription is Premium and validated server-side',
          priority: 'P0',
          sourceReference: 'Backend AC: "User hanya dapat mengakses fitur Premium (data real-time, universe Watchlist/Portfolio, preset melebihi batas, edit basket & periode Backtest > 6M, Export) bila paketnya Premium — divalidasi server-side"',
        },
        {
          tcId: 'TC-109',
          title: 'Verify upgrade prompt is displayed to user when trying to access Premium feature without Premium subscription',
          priority: 'P1',
          sourceReference: 'Backend AC: "jika tidak, User dapat melihat prompt upgrade"',
        },
      ],
      sourceSection: 'Backend Acceptance Criteria',
    },
    {
      moduleNum: 37,
      name: 'Data Persistence & Audit',
      testCases: [
        {
          tcId: 'TC-110',
          title: 'Verify saved screener and preset can be reopened identically after application reload',
          priority: 'P0',
          sourceReference: 'Backend AC: "User dapat membuka kembali saved screener & preset yang identik setelah aplikasi dimuat ulang"',
        },
        {
          tcId: 'TC-111',
          title: 'Verify each screener run and backtest is logged for audit and analytics',
          priority: 'P1',
          sourceReference: 'Backend AC: "Setiap run screener/backtest ter-log untuk audit/analitik"',
        },
        {
          tcId: 'TC-112',
          title: 'Verify endpoints are rate-limited to prevent abuse',
          priority: 'P1',
          sourceReference: 'Backend AC: "endpoint rate-limited"',
        },
      ],
      sourceSection: 'Backend Acceptance Criteria',
    },
  ]
}

/**
 * Parse Frontend Acceptance Criteria
 */
function parseFrontendCriteria(): PRDModule[] {
  return [
    {
      moduleNum: 38,
      name: 'Navigation & Tab Switching',
      testCases: [
        {
          tcId: 'TC-113',
          title: 'Verify Stock Screener can be opened from Market page',
          priority: 'P0',
          sourceReference: 'Frontend AC: "User dapat membuka Stock Screener dari halaman Market"',
        },
        {
          tcId: 'TC-114',
          title: 'Verify user can switch between Popular and Technical tabs',
          priority: 'P1',
          sourceReference: 'Frontend AC: "dan berpindah antara tab Popular dan Technical"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 39,
      name: 'Popular Tab Functionality',
      testCases: [
        {
          tcId: 'TC-115',
          title: 'Verify fundamental data is visible on Popular tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "(Popular) User dapat melihat data fundamental"',
        },
        {
          tcId: 'TC-116',
          title: 'Verify stock search is available on Popular tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "mencari saham"',
        },
        {
          tcId: 'TC-117',
          title: 'Verify filters can be added via Add Filter up to max 10 on Popular tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "menambah filter via Add Filter (Max. 10)"',
        },
        {
          tcId: 'TC-118',
          title: 'Verify results can be sorted by column on Popular tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "mengurutkan per kolom"',
        },
        {
          tcId: 'TC-119',
          title: 'Verify Stock Detail opens when clicking result row on Popular tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "klik baris untuk melihat detail"',
        },
        {
          tcId: 'TC-120',
          title: 'Verify pagination works with 10 stocks per page on Popular tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "dan berpindah halaman (10 saham/halaman)"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 40,
      name: 'Technical Tab Functionality',
      testCases: [
        {
          tcId: 'TC-121',
          title: 'Verify presets can be selected on Technical tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "(Technical) User dapat memilih preset"',
        },
        {
          tcId: 'TC-122',
          title: 'Verify custom presets can be saved, renamed, and deleted on Technical tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "menyimpan, me-rename, & menghapus preset sendiri (dengan penamaan di aplikasi)"',
        },
        {
          tcId: 'TC-123',
          title: 'Verify up to 3 conditions can be created on Technical tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "menyusun kondisi (maks 3)"',
        },
        {
          tcId: 'TC-124',
          title: 'Verify universe can be selected via dropdown on Technical tab including Index, Watchlist, Portfolio',
          priority: 'P1',
          sourceReference: 'Frontend AC: "memilih universe (Index/Watchlist/Portfolio via dropdown)"',
        },
        {
          tcId: 'TC-125',
          title: 'Verify period can be selected on Technical tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "periode"',
        },
        {
          tcId: 'TC-126',
          title: 'Verify Run Screen button executes screening on Technical tab',
          priority: 'P1',
          sourceReference: 'Frontend AC: "lalu klik Run Screen"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 41,
      name: 'Result Display & Interaction',
      testCases: [
        {
          tcId: 'TC-127',
          title: 'Verify results display with max 10 per page after screening',
          priority: 'P1',
          sourceReference: 'Frontend AC: "User dapat melihat hasil screening (maks 10 per halaman)"',
        },
        {
          tcId: 'TC-128',
          title: 'Verify results can be sorted by column',
          priority: 'P1',
          sourceReference: 'Frontend AC: "mengurutkan per kolom"',
        },
        {
          tcId: 'TC-129',
          title: 'Verify Stock Detail opens when clicking result row',
          priority: 'P1',
          sourceReference: 'Frontend AC: "dan klik baris untuk membuka Stock Detail"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 42,
      name: 'Backtest Workflow',
      testCases: [
        {
          tcId: 'TC-130',
          title: 'Verify Backtest button can be clicked to initiate backtest',
          priority: 'P1',
          sourceReference: 'Frontend AC: "User dapat klik Backtest"',
        },
        {
          tcId: 'TC-131',
          title: 'Verify basket can be viewed and adjusted by deleting stocks',
          priority: 'P1',
          sourceReference: 'Frontend AC: "melihat & mengatur basket (hapus /"',
        },
        {
          tcId: 'TC-132',
          title: 'Verify stocks can be added to basket',
          priority: 'P1',
          sourceReference: 'Frontend AC: "tambah saham"',
        },
        {
          tcId: 'TC-133',
          title: 'Verify basket can be reset to screening results',
          priority: 'P1',
          sourceReference: 'Frontend AC: "reset ke hasil screening"',
        },
        {
          tcId: 'TC-134',
          title: 'Verify strategy conditions can be edited with max 3 conditions from screening conditions',
          priority: 'P1',
          sourceReference: 'Frontend AC: "mengedit strategi yang diambil dari kondisi screening (maks 3)"',
        },
        {
          tcId: 'TC-135',
          title: 'Verify backtest period can be selected including 6M, 1Y, 3Y, 5Y',
          priority: 'P1',
          sourceReference: 'Frontend AC: "memilih periode (6M / 1Y / 3Y / 5Y)"',
        },
        {
          tcId: 'TC-136',
          title: 'Verify initial capital can be entered',
          priority: 'P1',
          sourceReference: 'Frontend AC: "modal awal"',
        },
        {
          tcId: 'TC-137',
          title: 'Verify Run backtest button executes backtest',
          priority: 'P1',
          sourceReference: 'Frontend AC: "lalu klik Run backtest"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 43,
      name: 'Backtest Results Display',
      testCases: [
        {
          tcId: 'TC-138',
          title: 'Verify backtest statistics are displayed including Return, Win Rate, Drawdown',
          priority: 'P1',
          sourceReference: 'Frontend AC: "User dapat melihat statistik & equity curve backtest"',
        },
        {
          tcId: 'TC-139',
          title: 'Verify equity curve is displayed comparing strategy vs buy & hold',
          priority: 'P1',
          sourceReference: 'Frontend AC: "equity curve backtest"',
        },
        {
          tcId: 'TC-140',
          title: 'Verify per-stock transaction details open when clicking stock row in backtest results',
          priority: 'P1',
          sourceReference: 'Frontend AC: "dan klik baris per saham untuk melihat detail transaksi (entry/exit & return per trade)"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 44,
      name: 'Export & Download',
      testCases: [
        {
          tcId: 'TC-141',
          title: 'Verify screening results can be downloaded as CSV or Excel file',
          priority: 'P2',
          sourceReference: 'Frontend AC: "User dapat melakukan download hasil screening sebagai file (CSV / Excel)"',
        },
        {
          tcId: 'TC-142',
          title: 'Verify export is restricted to Premium subscription only',
          priority: 'P1',
          sourceReference: 'Frontend AC: "(Premium.)"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 45,
      name: 'Subscription & Data Status Indicators',
      testCases: [
        {
          tcId: 'TC-143',
          title: 'Verify Free/Premium subscription badge is visible to user',
          priority: 'P1',
          sourceReference: 'Frontend AC: "User dapat melihat penanda paket (Free/Premium)"',
        },
        {
          tcId: 'TC-144',
          title: 'Verify data status badge showing Delayed 15m or Real-time is visible',
          priority: 'P1',
          sourceReference: 'Frontend AC: "badge data (Delayed 15m / Real-time)"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 46,
      name: 'Premium Feature Gating - UI',
      testCases: [
        {
          tcId: 'TC-145',
          title: 'Verify Premium features are locked for Free users showing upgrade prompt for Watchlist/Portfolio universe',
          priority: 'P1',
          sourceReference: 'Frontend AC: "Fitur yang terkunci untuk Free — universe Watchlist/Portfolio"',
        },
        {
          tcId: 'TC-146',
          title: 'Verify Premium features are locked for Free users showing upgrade prompt for preset beyond limit',
          priority: 'P1',
          sourceReference: 'Frontend AC: "preset melebihi batas"',
        },
        {
          tcId: 'TC-147',
          title: 'Verify Premium features are locked for Free users showing upgrade prompt for edit basket and backtest period 1Y-5Y',
          priority: 'P1',
          sourceReference: 'Frontend AC: "edit basket & periode 1Y–5Y Backtest"',
        },
        {
          tcId: 'TC-148',
          title: 'Verify Premium features are locked for Free users showing upgrade prompt for Export',
          priority: 'P1',
          sourceReference: 'Frontend AC: "Export"',
        },
        {
          tcId: 'TC-149',
          title: 'Verify upgrade prompt is neutral and non-advice without dead end',
          priority: 'P1',
          sourceReference: 'Frontend AC: "menampilkan prompt upgrade yang netral (non-advice) tanpa jalan buntu"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 47,
      name: 'UI States & Localization',
      testCases: [
        {
          tcId: 'TC-150',
          title: 'Verify empty state is displayed when no results found',
          priority: 'P1',
          sourceReference: 'Frontend AC: "User dapat melihat state empty / loading / error"',
        },
        {
          tcId: 'TC-151',
          title: 'Verify loading state is displayed during screening',
          priority: 'P1',
          sourceReference: 'Frontend AC: "state empty / loading / error"',
        },
        {
          tcId: 'TC-152',
          title: 'Verify error state is displayed on screening failure',
          priority: 'P1',
          sourceReference: 'Frontend AC: "state empty / loading / error"',
        },
        {
          tcId: 'TC-153',
          title: 'Verify all text is available in English',
          priority: 'P1',
          sourceReference: 'Frontend AC: "seluruh teks tersedia EN & ID"',
        },
        {
          tcId: 'TC-154',
          title: 'Verify all text is available in Indonesian',
          priority: 'P1',
          sourceReference: 'Frontend AC: "seluruh teks tersedia EN & ID"',
        },
        {
          tcId: 'TC-155',
          title: 'Verify TICMI data source disclaimer is displayed',
          priority: 'P1',
          sourceReference: 'Frontend AC: "disclaimer TICMI & non-advice tampil"',
        },
        {
          tcId: 'TC-156',
          title: 'Verify non-advice disclaimer is displayed including on Backtest',
          priority: 'P1',
          sourceReference: 'Frontend AC: "non-advice tampil (termasuk pada Backtest)"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
    {
      moduleNum: 48,
      name: 'Responsive Design & Performance',
      testCases: [
        {
          tcId: 'TC-157',
          title: 'Verify interface is responsive and does not interfere with core Market page',
          priority: 'P1',
          sourceReference: 'Frontend AC: "Responsif & tidak mengganggu halaman Market inti"',
        },
      ],
      sourceSection: 'Frontend Acceptance Criteria',
    },
  ]
}

export function getStrictPRDTestCases(): PRDModule[] {
  const allModules: PRDModule[] = []

  allModules.push(...parseUserStories())
  allModules.push(...parseUseCases())
  allModules.push(...parseBackendCriteria())
  allModules.push(...parseFrontendCriteria())

  return allModules
}

export function getTotalTestCaseCount(): number {
  return getStrictPRDTestCases().reduce((acc, mod) => acc + mod.testCases.length, 0)
}

export function getModuleCount(): number {
  return getStrictPRDTestCases().length
}
