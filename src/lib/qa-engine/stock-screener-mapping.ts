/**
 * Stock Screener PRD - Comprehensive Test Case Mapping
 * Maps 22 modules to 161 test cases
 * Based on: DT-PRD-2026-017_ Stock Screener-210726-115334.pdf
 */

export interface TestCaseItem {
  id: string
  title: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
}

export interface ModuleMapping {
  number: number
  name: string
  testCases: TestCaseItem[]
}

export const STOCK_SCREENER_MODULES: ModuleMapping[] = [
  {
    number: 1,
    name: 'Navigation',
    testCases: [
      {
        id: 'TC-001',
        title: 'Verify Stock Screener is accessible when user opens Stock Screener from Market',
        priority: 'Critical',
      },
      {
        id: 'TC-002',
        title: 'Verify navigation between Popular and Technical screens when user switches tabs',
        priority: 'Critical',
      },
    ],
  },
  {
    number: 2,
    name: 'Popular Screener',
    testCases: [
      {
        id: 'TC-003',
        title: 'Verify fundamental data is displayed when user views Popular screen',
        priority: 'High',
      },
      {
        id: 'TC-004',
        title: 'Verify stock search works when user enters ticker or name in search field',
        priority: 'High',
      },
      {
        id: 'TC-005',
        title: 'Verify Add Filter button is available when user opens Popular screen',
        priority: 'High',
      },
      {
        id: 'TC-006',
        title: 'Verify filter can be added when user selects field from Add Filter menu',
        priority: 'High',
      },
      {
        id: 'TC-007',
        title: 'Verify filter can be removed when user clicks remove on active filter',
        priority: 'High',
      },
      {
        id: 'TC-008',
        title: 'Verify active filter count badge updates when user adds or removes filter',
        priority: 'High',
      },
      {
        id: 'TC-009',
        title: 'Verify numeric filter applies range when user enters min and max values',
        priority: 'High',
      },
      {
        id: 'TC-010',
        title: 'Verify Sector filter applies selection when user chooses sector value',
        priority: 'High',
      },
      {
        id: 'TC-011',
        title: 'Verify Industry filter applies selection when user chooses industry value',
        priority: 'High',
      },
      {
        id: 'TC-012',
        title: 'Verify maximum filter limit is enforced when user attempts to add more than 10 filters',
        priority: 'High',
      },
    ],
  },
  {
    number: 3,
    name: 'Technical Screener',
    testCases: [
      {
        id: 'TC-013',
        title: 'Verify Technical screen loads when user navigates to Technical tab',
        priority: 'High',
      },
      {
        id: 'TC-014',
        title: 'Verify preset strategies are displayed when user opens Technical screen',
        priority: 'High',
      },
      {
        id: 'TC-015',
        title: 'Verify preset list scrolls when user gestures on preset carousel',
        priority: 'High',
      },
      {
        id: 'TC-016',
        title: 'Verify strategy conditions load when user selects a preset',
        priority: 'High',
      },
      {
        id: 'TC-017',
        title: 'Verify Run Screen executes when user clicks Run Screen',
        priority: 'Critical',
      },
    ],
  },
  {
    number: 4,
    name: 'Filter Builder',
    testCases: [
      {
        id: 'TC-018',
        title: 'Verify condition field selection works when user chooses indicator from dropdown',
        priority: 'High',
      },
      {
        id: 'TC-019',
        title: 'Verify operator selection works when user chooses comparison operator',
        priority: 'High',
      },
      {
        id: 'TC-020',
        title: 'Verify numeric value input works when user enters value for condition',
        priority: 'High',
      },
      {
        id: 'TC-021',
        title: 'Verify condition can be added when user clicks Add Condition',
        priority: 'High',
      },
      {
        id: 'TC-022',
        title: 'Verify condition can be removed when user clicks remove on existing condition',
        priority: 'High',
      },
      {
        id: 'TC-023',
        title: 'Verify maximum condition limit is enforced when user attempts to add more than 3 conditions',
        priority: 'High',
      },
      {
        id: 'TC-024',
        title: 'Verify condition comparing to another field works when user selects field as value',
        priority: 'High',
      },
    ],
  },
  {
    number: 5,
    name: 'Universe',
    testCases: [
      {
        id: 'TC-025',
        title: 'Verify universe selection shows Index option when user opens universe dropdown',
        priority: 'High',
      },
      {
        id: 'TC-026',
        title: 'Verify universe selection shows Watchlist option when user opens universe dropdown',
        priority: 'High',
      },
      {
        id: 'TC-027',
        title: 'Verify universe selection shows Portfolio option when user opens universe dropdown',
        priority: 'High',
      },
      {
        id: 'TC-028',
        title: 'Verify Index list loads when user selects Index universe',
        priority: 'High',
      },
      {
        id: 'TC-029',
        title: 'Verify specific Index applies when user selects index from dropdown',
        priority: 'High',
      },
      {
        id: 'TC-030',
        title: 'Verify Watchlist loads when user selects Watchlist universe',
        priority: 'High',
      },
      {
        id: 'TC-031',
        title: 'Verify specific Watchlist applies when user selects watchlist from dropdown',
        priority: 'High',
      },
      {
        id: 'TC-032',
        title: 'Verify Portfolio loads when user selects Portfolio universe',
        priority: 'High',
      },
      {
        id: 'TC-033',
        title: 'Verify specific Portfolio applies when user selects portfolio from dropdown',
        priority: 'High',
      },
    ],
  },
  {
    number: 6,
    name: 'Result Table',
    testCases: [
      {
        id: 'TC-034',
        title: 'Verify screening results display when screening completes',
        priority: 'Critical',
      },
      {
        id: 'TC-035',
        title: 'Verify ticker column shows stock code when results load',
        priority: 'High',
      },
      {
        id: 'TC-036',
        title: 'Verify last price column shows current price when results load',
        priority: 'High',
      },
      {
        id: 'TC-037',
        title: 'Verify change nominal column shows Rupiah change when results load',
        priority: 'High',
      },
      {
        id: 'TC-038',
        title: 'Verify change percentage column shows percentage change when results load',
        priority: 'High',
      },
      {
        id: 'TC-039',
        title: 'Verify volume column shows trading volume when results load',
        priority: 'High',
      },
      {
        id: 'TC-040',
        title: 'Verify optional indicator columns display when indicators are selected',
        priority: 'High',
      },
      {
        id: 'TC-041',
        title: 'Verify row click navigates to Stock Detail when user clicks result row',
        priority: 'High',
      },
    ],
  },
  {
    number: 7,
    name: 'Pagination',
    testCases: [
      {
        id: 'TC-042',
        title: 'Verify maximum 10 items per page display when results load',
        priority: 'High',
      },
      {
        id: 'TC-043',
        title: 'Verify next page loads when user clicks next pagination control',
        priority: 'High',
      },
      {
        id: 'TC-044',
        title: 'Verify previous page loads when user clicks previous pagination control',
        priority: 'High',
      },
      {
        id: 'TC-045',
        title: 'Verify page indicator shows current page when pagination loads',
        priority: 'High',
      },
    ],
  },
  {
    number: 8,
    name: 'Sorting',
    testCases: [
      {
        id: 'TC-046',
        title: 'Verify column sort works when user clicks column header',
        priority: 'High',
      },
      {
        id: 'TC-047',
        title: 'Verify sorting order toggles when user clicks same column header',
        priority: 'High',
      },
      {
        id: 'TC-048',
        title: 'Verify results reorder when sorting applies',
        priority: 'High',
      },
    ],
  },
  {
    number: 9,
    name: 'Preset Management',
    testCases: [
      {
        id: 'TC-049',
        title: 'Verify preset can be saved when user clicks Save Preset',
        priority: 'Critical',
      },
      {
        id: 'TC-050',
        title: 'Verify naming prompt appears when user saves preset',
        priority: 'High',
      },
      {
        id: 'TC-051',
        title: 'Verify preset persists across sessions when user saves preset',
        priority: 'High',
      },
      {
        id: 'TC-052',
        title: 'Verify preset can be renamed when user chooses rename option',
        priority: 'High',
      },
      {
        id: 'TC-053',
        title: 'Verify preset can be deleted when user chooses delete option',
        priority: 'High',
      },
      {
        id: 'TC-054',
        title: 'Verify saved preset loads when user selects saved preset',
        priority: 'High',
      },
      {
        id: 'TC-055',
        title: 'Verify preset count limit applies when Free user attempts to save more than 1 preset',
        priority: 'High',
      },
      {
        id: 'TC-056',
        title: 'Verify unlimited presets available when Premium user saves presets',
        priority: 'High',
      },
    ],
  },
  {
    number: 10,
    name: 'Period Selection',
    testCases: [
      {
        id: 'TC-057',
        title: 'Verify 1D period applies when user selects 1D from period dropdown',
        priority: 'High',
      },
      {
        id: 'TC-058',
        title: 'Verify 1W period applies when user selects 1W from period dropdown',
        priority: 'High',
      },
      {
        id: 'TC-059',
        title: 'Verify 1M period applies when user selects 1M from period dropdown',
        priority: 'High',
      },
      {
        id: 'TC-060',
        title: 'Verify 3M period applies when user selects 3M from period dropdown',
        priority: 'High',
      },
      {
        id: 'TC-061',
        title: 'Verify 6M period applies when user selects 6M from period dropdown',
        priority: 'High',
      },
      {
        id: 'TC-062',
        title: 'Verify 1Y period applies when user selects 1Y from period dropdown',
        priority: 'High',
      },
    ],
  },
  {
    number: 11,
    name: 'Backtest',
    testCases: [
      {
        id: 'TC-063',
        title: 'Verify Backtest button is available when screening results display',
        priority: 'High',
      },
      {
        id: 'TC-064',
        title: 'Verify Backtest screen opens when user clicks Backtest',
        priority: 'Critical',
      },
      {
        id: 'TC-065',
        title: 'Verify basket contains all screening results when Backtest initializes',
        priority: 'High',
      },
      {
        id: 'TC-066',
        title: 'Verify stock can be removed from basket when user removes stock',
        priority: 'High',
      },
      {
        id: 'TC-067',
        title: 'Verify stock can be added to basket when user adds stock from universe',
        priority: 'High',
      },
      {
        id: 'TC-068',
        title: 'Verify basket resets to screening results when user clicks reset',
        priority: 'High',
      },
      {
        id: 'TC-069',
        title: 'Verify strategy auto-populates from screening conditions when Backtest loads',
        priority: 'High',
      },
      {
        id: 'TC-070',
        title: 'Verify strategy condition can be added when user adds condition',
        priority: 'High',
      },
      {
        id: 'TC-071',
        title: 'Verify strategy condition can be edited when user edits existing condition',
        priority: 'High',
      },
      {
        id: 'TC-072',
        title: 'Verify strategy condition can be removed when user removes condition',
        priority: 'High',
      },
      {
        id: 'TC-073',
        title: 'Verify maximum strategy condition limit is enforced when user attempts to add more than 3 conditions',
        priority: 'High',
      },
      {
        id: 'TC-074',
        title: 'Verify Entry trigger occurs when all strategy conditions are met',
        priority: 'High',
      },
      {
        id: 'TC-075',
        title: 'Verify Exit trigger occurs when strategy conditions are no longer met',
        priority: 'High',
      },
    ],
  },
  {
    number: 12,
    name: 'Backtest Parameters and Results',
    testCases: [
      {
        id: 'TC-076',
        title: 'Verify 6M Backtest period applies when user selects 6M',
        priority: 'Critical',
      },
      {
        id: 'TC-077',
        title: 'Verify 1Y Backtest period applies when user selects 1Y',
        priority: 'Critical',
      },
      {
        id: 'TC-078',
        title: 'Verify 3Y Backtest period applies when user selects 3Y',
        priority: 'Critical',
      },
      {
        id: 'TC-079',
        title: 'Verify 5Y Backtest period applies when user selects 5Y',
        priority: 'Critical',
      },
      {
        id: 'TC-080',
        title: 'Verify initial capital input accepts value when user enters capital amount',
        priority: 'Critical',
      },
      {
        id: 'TC-081',
        title: 'Verify Run Backtest executes when user clicks Run Backtest',
        priority: 'Critical',
      },
      {
        id: 'TC-082',
        title: 'Verify Total Return statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-083',
        title: 'Verify Buy and Hold statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-084',
        title: 'Verify Final Equity statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-085',
        title: 'Verify Number of Trades statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-086',
        title: 'Verify Win Rate statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-087',
        title: 'Verify Profit Factor statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-088',
        title: 'Verify Max Drawdown statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-089',
        title: 'Verify Average Trade statistic displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-090',
        title: 'Verify Equity Curve displays when Backtest completes',
        priority: 'Critical',
      },
      {
        id: 'TC-091',
        title: 'Verify Buy and Hold equity curve displays when Backtest completes',
        priority: 'High',
      },
    ],
  },
  {
    number: 13,
    name: 'Backtest Transaction Details',
    testCases: [
      {
        id: 'TC-092',
        title: 'Verify trade count per stock displays when user views Backtest results',
        priority: 'High',
      },
      {
        id: 'TC-093',
        title: 'Verify win rate per stock displays when user views Backtest results',
        priority: 'High',
      },
      {
        id: 'TC-094',
        title: 'Verify return per stock displays when user views Backtest results',
        priority: 'High',
      },
      {
        id: 'TC-095',
        title: 'Verify contribution per stock displays when user views Backtest results',
        priority: 'High',
      },
      {
        id: 'TC-096',
        title: 'Verify stock row click expands transaction details when user clicks stock row',
        priority: 'High',
      },
      {
        id: 'TC-097',
        title: 'Verify Entry date displays when transaction details load',
        priority: 'High',
      },
      {
        id: 'TC-098',
        title: 'Verify Entry price displays when transaction details load',
        priority: 'High',
      },
      {
        id: 'TC-099',
        title: 'Verify Exit date displays when transaction details load',
        priority: 'High',
      },
      {
        id: 'TC-100',
        title: 'Verify Exit price displays when transaction details load',
        priority: 'High',
      },
      {
        id: 'TC-101',
        title: 'Verify return per trade displays when transaction details load',
        priority: 'High',
      },
    ],
  },
  {
    number: 14,
    name: 'Export',
    testCases: [
      {
        id: 'TC-102',
        title: 'Verify CSV export is available when Premium user accesses results',
        priority: 'High',
      },
      {
        id: 'TC-103',
        title: 'Verify Excel export is available when Premium user accesses results',
        priority: 'High',
      },
      {
        id: 'TC-104',
        title: 'Verify export completes when user initiates download',
        priority: 'High',
      },
      {
        id: 'TC-105',
        title: 'Verify export option is hidden when Free user accesses results',
        priority: 'High',
      },
    ],
  },
  {
    number: 15,
    name: 'Save and Load Screener',
    testCases: [
      {
        id: 'TC-106',
        title: 'Verify screener configuration saves when user clicks Save Screener',
        priority: 'High',
      },
      {
        id: 'TC-107',
        title: 'Verify screener loads when user selects saved screener',
        priority: 'High',
      },
      {
        id: 'TC-108',
        title: 'Verify saved screener persists across sessions when user saves configuration',
        priority: 'High',
      },
      {
        id: 'TC-109',
        title: 'Verify screener can be renamed when user renames saved configuration',
        priority: 'High',
      },
      {
        id: 'TC-110',
        title: 'Verify screener can be deleted when user deletes saved configuration',
        priority: 'High',
      },
    ],
  },
  {
    number: 16,
    name: 'Data Modes',
    testCases: [
      {
        id: 'TC-111',
        title: 'Verify Real-time data displays when Premium user selects real-time',
        priority: 'Critical',
      },
      {
        id: 'TC-112',
        title: 'Verify Delayed data displays when Free user accesses screener',
        priority: 'Critical',
      },
      {
        id: 'TC-113',
        title: 'Verify Delayed badge appears when delayed data displays',
        priority: 'Critical',
      },
      {
        id: 'TC-114',
        title: 'Verify Real-time badge appears when real-time data displays',
        priority: 'Critical',
      },
      {
        id: 'TC-115',
        title: 'Verify Data status indicator updates when data source changes',
        priority: 'High',
      },
      {
        id: 'TC-116',
        title: 'Verify Timestamp displays when data refreshes',
        priority: 'High',
      },
      {
        id: 'TC-117',
        title: 'Verify Stale indicator appears when feed fails',
        priority: 'High',
      },
      {
        id: 'TC-118',
        title: 'Verify Screener continues with delayed data when real-time feed fails',
        priority: 'High',
      },
    ],
  },
  {
    number: 17,
    name: 'Feature Gating',
    testCases: [
      {
        id: 'TC-119',
        title: 'Verify Real-time data accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-120',
        title: 'Verify Watchlist universe accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-121',
        title: 'Verify Portfolio universe accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-122',
        title: 'Verify Unlimited presets accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-123',
        title: 'Verify Backtest basket editable when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-124',
        title: 'Verify Backtest 1Y period accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-125',
        title: 'Verify Backtest 3Y period accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-126',
        title: 'Verify Backtest 5Y period accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-127',
        title: 'Verify Export accessible when Premium entitlement validates',
        priority: 'Critical',
      },
      {
        id: 'TC-128',
        title: 'Verify Upgrade prompt displays when Free user attempts premium action',
        priority: 'Critical',
      },
      {
        id: 'TC-129',
        title: 'Verify Upgrade prompt is neutral and non-advice when displayed',
        priority: 'High',
      },
    ],
  },
  {
    number: 18,
    name: 'Alerts',
    testCases: [
      {
        id: 'TC-130',
        title: 'Verify Alert can be created from screener criteria when user sets alert',
        priority: 'High',
      },
      {
        id: 'TC-131',
        title: 'Verify Alert triggers when stock meets screener criteria',
        priority: 'High',
      },
    ],
  },
  {
    number: 19,
    name: 'States and Localization',
    testCases: [
      {
        id: 'TC-132',
        title: 'Verify Empty state displays when screening returns no results',
        priority: 'High',
      },
      {
        id: 'TC-133',
        title: 'Verify Loading state displays when screening executes',
        priority: 'High',
      },
      {
        id: 'TC-134',
        title: 'Verify Error state displays when screening fails',
        priority: 'High',
      },
      {
        id: 'TC-135',
        title: 'Verify Recovery option available when error occurs',
        priority: 'High',
      },
      {
        id: 'TC-136',
        title: 'Verify English language displays when user selects EN',
        priority: 'High',
      },
      {
        id: 'TC-137',
        title: 'Verify Indonesian language displays when user selects ID',
        priority: 'High',
      },
      {
        id: 'TC-138',
        title: 'Verify TICMI data source disclaimer displays on all results',
        priority: 'Critical',
      },
      {
        id: 'TC-139',
        title: 'Verify Non-advice disclaimer displays on all results',
        priority: 'Critical',
      },
      {
        id: 'TC-140',
        title: 'Verify Non-advice disclaimer displays on Backtest',
        priority: 'Critical',
      },
      {
        id: 'TC-141',
        title: 'Verify Non-advice disclaimer displays on presets',
        priority: 'Critical',
      },
    ],
  },
  {
    number: 20,
    name: 'Data Integrity',
    testCases: [
      {
        id: 'TC-142',
        title: 'Verify Price change nominal aligns with tick-size when results display',
        priority: 'Critical',
      },
      {
        id: 'TC-143',
        title: 'Verify Price change percentage calculation is accurate when results display',
        priority: 'Critical',
      },
      {
        id: 'TC-144',
        title: 'Verify Fundamental metrics display licensed data when results load',
        priority: 'Critical',
      },
      {
        id: 'TC-145',
        title: 'Verify Technical indicators are reproducible when indicators calculate',
        priority: 'Critical',
      },
      {
        id: 'TC-146',
        title: 'Verify Foreign net flow displays licensed data when results load',
        priority: 'Critical',
      },
      {
        id: 'TC-147',
        title: 'Verify Backtest uses historical data without look-ahead bias',
        priority: 'Critical',
      },
      {
        id: 'TC-148',
        title: 'Verify Accuracy meets threshold when screening results compare with IDX data',
        priority: 'Critical',
      },
    ],
  },
  {
    number: 21,
    name: 'Security and Observability',
    testCases: [
      {
        id: 'TC-149',
        title: 'Verify Feature flag controls surface when kill switch activates',
        priority: 'High',
      },
      {
        id: 'TC-150',
        title: 'Verify Feature flag controls preset when kill switch activates',
        priority: 'High',
      },
      {
        id: 'TC-151',
        title: 'Verify Screener run logs when screening executes',
        priority: 'High',
      },
      {
        id: 'TC-152',
        title: 'Verify Backtest execution logs when Backtest runs',
        priority: 'High',
      },
      {
        id: 'TC-153',
        title: 'Verify Save configuration logs when user saves screener',
        priority: 'High',
      },
      {
        id: 'TC-154',
        title: 'Verify Load configuration logs when user loads screener',
        priority: 'High',
      },
      {
        id: 'TC-155',
        title: 'Verify Preset interaction logs when user uses preset',
        priority: 'High',
      },
      {
        id: 'TC-156',
        title: 'Verify Criteria selection logs when user applies filters',
        priority: 'High',
      },
      {
        id: 'TC-157',
        title: 'Verify Timestamp logs in WIB when actions occur',
        priority: 'High',
      },
      {
        id: 'TC-158',
        title: 'Verify Endpoint rate limiting applies when requests exceed threshold',
        priority: 'High',
      },
      {
        id: 'TC-159',
        title: 'Verify Server-side entitlement validation occurs when user accesses premium feature',
        priority: 'High',
      },
    ],
  },
  {
    number: 22,
    name: 'End-to-End Flows',
    testCases: [
      {
        id: 'TC-160',
        title: 'Verify Complete screening and detail flow works when user navigates from screener to stock detail',
        priority: 'Critical',
      },
      {
        id: 'TC-161',
        title: 'Verify Complete Backtest flow works when user screens then backtests results',
        priority: 'Critical',
      },
    ],
  },
]

export function getStockScreenerModules(): ModuleMapping[] {
  return STOCK_SCREENER_MODULES
}

export function getTotalTestCases(): number {
  return STOCK_SCREENER_MODULES.reduce((sum, module) => sum + module.testCases.length, 0)
}

export function getCoverageByPriority(): Record<string, number> {
  const coverage: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  }

  STOCK_SCREENER_MODULES.forEach((module) => {
    module.testCases.forEach((testCase) => {
      coverage[testCase.priority]++
    })
  })

  return coverage
}
