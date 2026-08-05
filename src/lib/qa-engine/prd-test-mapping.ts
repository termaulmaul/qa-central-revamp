/**
 * Complete PRD-to-Test Case mapping for Stock Screener
 * Maps 19 modules to 172 comprehensive test cases
 */

export interface TestCaseData {
  tcNumber: number
  testCase: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
}

export interface ModuleData {
  moduleNumber: number
  moduleName: string
  relatedFeatures: string[]
  testCases: TestCaseData[]
}

/**
 * Complete test mapping database with all 172 test cases across 19 modules
 */
export const PRD_TEST_MODULES: ModuleData[] = [
  {
    moduleNumber: 1,
    moduleName: 'Screening Navigation and Entry Points',
    relatedFeatures: ['F1'],
    testCases: [
      { tcNumber: 1, testCase: 'Verify Stock Screener page opens when user navigates from Market page', priority: 'Critical' },
      { tcNumber: 2, testCase: 'Verify Popular tab displays fundamental data when user selects Popular tab', priority: 'Critical' },
      { tcNumber: 3, testCase: 'Verify Technical tab displays technical screening interface when user selects Technical tab', priority: 'Critical' },
      { tcNumber: 4, testCase: 'Verify search results are displayed when user searches stock by name in Popular tab', priority: 'High' },
      { tcNumber: 5, testCase: 'Verify stock detail page opens when user clicks row in result table', priority: 'Critical' },
    ],
  },
  {
    moduleNumber: 2,
    moduleName: 'Basic and Fundamental Filtering',
    relatedFeatures: ['F2', 'F7'],
    testCases: [
      { tcNumber: 6, testCase: 'Verify filter is added via Add Filter button when user selects filter field in Popular tab', priority: 'Critical' },
      { tcNumber: 7, testCase: 'Verify max 10 filters are applied when user adds filters in Popular tab', priority: 'Critical' },
      { tcNumber: 8, testCase: 'Verify numeric range filter is applied when user enters min-max values for numerical filters', priority: 'Critical' },
      { tcNumber: 9, testCase: 'Verify sector filter is applied when user selects sector value from dropdown', priority: 'High' },
      { tcNumber: 10, testCase: 'Verify industry filter is applied when user selects industry value from dropdown', priority: 'High' },
      { tcNumber: 11, testCase: 'Verify filter is removed when user deletes active filter', priority: 'High' },
      { tcNumber: 12, testCase: 'Verify active filter count is displayed on badge when filters are applied', priority: 'High' },
      { tcNumber: 13, testCase: 'Verify Price per Lot filter is applied when user enters min-max value', priority: 'Medium' },
      { tcNumber: 14, testCase: 'Verify Day Change percentage filter is applied when user enters min-max value', priority: 'Medium' },
      { tcNumber: 15, testCase: 'Verify Day Change Rupiah filter is applied when user enters min-max value', priority: 'Medium' },
    ],
  },
  {
    moduleNumber: 3,
    moduleName: 'Fundamental Data Display',
    relatedFeatures: ['F1'],
    testCases: [
      { tcNumber: 16, testCase: 'Verify list of stocks with fundamental data is displayed when user views Popular tab', priority: 'Critical' },
      { tcNumber: 17, testCase: 'Verify sector information is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 18, testCase: 'Verify industry information is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 19, testCase: 'Verify market capitalization is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 20, testCase: 'Verify yearly P/E ratio is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 21, testCase: 'Verify quarterly P/E ratio is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 22, testCase: 'Verify price per lot is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 23, testCase: 'Verify day change percentage is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 24, testCase: 'Verify day change Rupiah is displayed for each stock when viewing Popular tab', priority: 'High' },
      { tcNumber: 25, testCase: 'Verify net income is displayed for each stock when viewing Popular tab', priority: 'Medium' },
      { tcNumber: 26, testCase: 'Verify dividend information is displayed for each stock when viewing Popular tab', priority: 'Medium' },
    ],
  },
  {
    moduleNumber: 4,
    moduleName: 'Technical Screening Presets',
    relatedFeatures: ['F3'],
    testCases: [
      { tcNumber: 27, testCase: 'Verify RSI Oversold preset is applied when user selects RSI Oversold preset', priority: 'Critical' },
      { tcNumber: 28, testCase: 'Verify RSI Overbought preset is applied when user selects RSI Overbought preset', priority: 'Critical' },
      { tcNumber: 29, testCase: 'Verify MACD Bullish preset is applied when user selects MACD Bullish preset', priority: 'Critical' },
      { tcNumber: 30, testCase: 'Verify Stoch Oversold preset is applied when user selects Stoch Oversold preset', priority: 'High' },
      { tcNumber: 31, testCase: 'Verify Volume Surge preset is applied when user selects Volume Surge preset', priority: 'High' },
      { tcNumber: 32, testCase: 'Verify Strong Trend preset is applied when user selects Strong Trend preset', priority: 'High' },
      { tcNumber: 33, testCase: 'Verify MACD Crossover preset is applied when user selects MACD Crossover preset', priority: 'High' },
      { tcNumber: 34, testCase: 'Verify additional presets are visible when user scrolls preset list', priority: 'High' },
    ],
  },
  {
    moduleNumber: 5,
    moduleName: 'Custom Preset Management',
    relatedFeatures: ['F4'],
    testCases: [
      { tcNumber: 35, testCase: 'Verify custom preset is saved when user clicks Save preset and enters name', priority: 'Critical' },
      { tcNumber: 36, testCase: 'Verify custom preset name is updated when user renames saved preset', priority: 'Critical' },
      { tcNumber: 37, testCase: 'Verify custom preset is deleted when user deletes saved preset', priority: 'Critical' },
      { tcNumber: 38, testCase: 'Verify custom preset persists across sessions when user saves preset', priority: 'Critical' },
      { tcNumber: 39, testCase: 'Verify free user can save maximum 1 custom preset when user is on Free plan', priority: 'High' },
      { tcNumber: 40, testCase: 'Verify premium user can save unlimited presets when user is on Premium plan', priority: 'High' },
    ],
  },
  {
    moduleNumber: 6,
    moduleName: 'Technical Condition Builder',
    relatedFeatures: ['F5'],
    testCases: [
      { tcNumber: 41, testCase: 'Verify technical condition is added when user selects field, operator, and value in Condition Builder', priority: 'Critical' },
      { tcNumber: 42, testCase: 'Verify condition field can be selected from available technical indicators when user builds condition', priority: 'Critical' },
      { tcNumber: 43, testCase: 'Verify operator can be selected from available operators when user builds condition', priority: 'Critical' },
      { tcNumber: 44, testCase: 'Verify value can be entered as number or another field when user builds condition', priority: 'High' },
      { tcNumber: 45, testCase: 'Verify maximum 3 technical conditions can be added when user builds conditions', priority: 'High' },
      { tcNumber: 46, testCase: 'Verify condition is removed when user deletes condition from Condition Builder', priority: 'High' },
      { tcNumber: 47, testCase: 'Verify screening runs when user clicks Run Screen after building conditions', priority: 'Critical' },
    ],
  },
  {
    moduleNumber: 7,
    moduleName: 'Universe Selection',
    relatedFeatures: ['F6'],
    testCases: [
      { tcNumber: 48, testCase: 'Verify Index universe is displayed when user selects Index sub-tab', priority: 'Critical' },
      { tcNumber: 49, testCase: 'Verify Watchlist universe is displayed when user selects Watchlist sub-tab', priority: 'High' },
      { tcNumber: 50, testCase: 'Verify Portfolio universe is displayed when user selects Portfolio sub-tab', priority: 'High' },
      { tcNumber: 51, testCase: 'Verify LQ45 index list is available when user selects Index dropdown', priority: 'High' },
      { tcNumber: 52, testCase: 'Verify IDX30 index list is available when user selects Index dropdown', priority: 'High' },
      { tcNumber: 53, testCase: 'Verify IDX80 index list is available when user selects Index dropdown', priority: 'Medium' },
      { tcNumber: 54, testCase: 'Verify KOMPAS100 index list is available when user selects Index dropdown', priority: 'Medium' },
      { tcNumber: 55, testCase: 'Verify IDX Energy index list is available when user selects Index dropdown', priority: 'Medium' },
      { tcNumber: 56, testCase: 'Verify IDX Financials index list is available when user selects Index dropdown', priority: 'Medium' },
      { tcNumber: 57, testCase: 'Verify IDX Consumer index list is available when user selects Index dropdown', priority: 'Medium' },
      { tcNumber: 58, testCase: 'Verify JII index list is available when user selects Index dropdown', priority: 'Medium' },
      { tcNumber: 59, testCase: 'Verify IDXBUMN20 index list is available when user selects Index dropdown', priority: 'Medium' },
      { tcNumber: 60, testCase: 'Verify user\'s watchlists are available when user selects Watchlist dropdown', priority: 'High' },
      { tcNumber: 61, testCase: 'Verify free user cannot access Watchlist universe when user is on Free plan', priority: 'High' },
      { tcNumber: 62, testCase: 'Verify free user cannot access Portfolio universe when user is on Free plan', priority: 'High' },
      { tcNumber: 63, testCase: 'Verify premium user can access Watchlist universe when user is on Premium plan', priority: 'High' },
      { tcNumber: 64, testCase: 'Verify premium user can access Portfolio universe when user is on Premium plan', priority: 'High' },
    ],
  },
  {
    moduleNumber: 8,
    moduleName: 'Period Selection',
    relatedFeatures: ['F10'],
    testCases: [
      { tcNumber: 65, testCase: 'Verify 1D data period is selectable when user chooses period option', priority: 'High' },
      { tcNumber: 66, testCase: 'Verify 1W data period is selectable when user chooses period option', priority: 'High' },
      { tcNumber: 67, testCase: 'Verify 1M data period is selectable when user chooses period option', priority: 'High' },
      { tcNumber: 68, testCase: 'Verify 3M data period is selectable when user chooses period option', priority: 'High' },
      { tcNumber: 69, testCase: 'Verify 6M data period is selectable when user chooses period option', priority: 'High' },
      { tcNumber: 70, testCase: 'Verify 1Y data period is selectable when user chooses period option', priority: 'High' },
    ],
  },
  {
    moduleNumber: 9,
    moduleName: 'Result Table and Pagination',
    relatedFeatures: ['F9'],
    testCases: [
      { tcNumber: 71, testCase: 'Verify ticker is displayed in result table when screening completes', priority: 'Critical' },
      { tcNumber: 72, testCase: 'Verify last price is displayed in result table when screening completes', priority: 'Critical' },
      { tcNumber: 73, testCase: 'Verify change nominal is displayed in result table when screening completes', priority: 'Critical' },
      { tcNumber: 74, testCase: 'Verify change percentage is displayed in result table when screening completes', priority: 'Critical' },
      { tcNumber: 75, testCase: 'Verify volume is displayed in result table when screening completes', priority: 'Critical' },
      { tcNumber: 76, testCase: 'Verify optional indicator columns are displayed in result table when configured', priority: 'High' },
      { tcNumber: 77, testCase: 'Verify table is sortable by each column when user clicks column header', priority: 'Critical' },
      { tcNumber: 78, testCase: 'Verify max 10 tickers are displayed per page when results are shown', priority: 'Critical' },
      { tcNumber: 79, testCase: 'Verify user can navigate to next page when pagination is used', priority: 'High' },
      { tcNumber: 80, testCase: 'Verify user can navigate to previous page when pagination is used', priority: 'High' },
    ],
  },
  {
    moduleNumber: 10,
    moduleName: 'Backtest Configuration and Execution',
    relatedFeatures: ['F11', 'F12', 'F13'],
    testCases: [
      { tcNumber: 81, testCase: 'Verify Backtest page opens when user clicks Backtest button on screening results', priority: 'Critical' },
      { tcNumber: 82, testCase: 'Verify basket contains all screening result stocks when backtest is opened', priority: 'Critical' },
      { tcNumber: 83, testCase: 'Verify stock can be removed from basket when user deletes stock from basket', priority: 'High' },
      { tcNumber: 84, testCase: 'Verify stock can be added to basket from universe when user adds stock to basket', priority: 'High' },
      { tcNumber: 85, testCase: 'Verify basket resets to screening results when user clicks reset button', priority: 'High' },
      { tcNumber: 86, testCase: 'Verify backtest strategy automatically uses screening conditions when backtest is opened', priority: 'High' },
      { tcNumber: 87, testCase: 'Verify strategy condition can be added when user edits backtest strategy', priority: 'High' },
      { tcNumber: 88, testCase: 'Verify strategy condition can be changed when user edits backtest strategy', priority: 'High' },
      { tcNumber: 89, testCase: 'Verify strategy condition can be deleted when user edits backtest strategy', priority: 'High' },
      { tcNumber: 90, testCase: 'Verify max 3 strategy conditions are allowed when user edits backtest strategy', priority: 'High' },
      { tcNumber: 91, testCase: 'Verify entry occurs when all strategy conditions are met during backtest simulation', priority: 'High' },
      { tcNumber: 92, testCase: 'Verify exit occurs when strategy conditions are no longer met during backtest simulation', priority: 'High' },
      { tcNumber: 93, testCase: 'Verify 6M backtest period is selectable when user chooses backtest period', priority: 'Critical' },
      { tcNumber: 94, testCase: 'Verify 1Y backtest period is selectable when user chooses backtest period', priority: 'High' },
      { tcNumber: 95, testCase: 'Verify 3Y backtest period is selectable when user chooses backtest period', priority: 'High' },
      { tcNumber: 96, testCase: 'Verify 5Y backtest period is selectable when user chooses backtest period', priority: 'High' },
      { tcNumber: 97, testCase: 'Verify initial capital can be entered when user sets up backtest', priority: 'Critical' },
      { tcNumber: 98, testCase: 'Verify backtest runs when user clicks Run backtest button', priority: 'Critical' },
      { tcNumber: 99, testCase: 'Verify free user can only access 6M backtest period when user is on Free plan', priority: 'High' },
      { tcNumber: 100, testCase: 'Verify free user basket is locked and cannot be edited when user is on Free plan', priority: 'High' },
      { tcNumber: 101, testCase: 'Verify premium user can access 6M, 1Y, 3Y, 5Y backtest periods when user is on Premium plan', priority: 'High' },
      { tcNumber: 102, testCase: 'Verify premium user basket is editable when user is on Premium plan', priority: 'High' },
    ],
  },
  {
    moduleNumber: 11,
    moduleName: 'Backtest Results Display',
    relatedFeatures: ['F14', 'F15'],
    testCases: [
      { tcNumber: 103, testCase: 'Verify Total Return statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 104, testCase: 'Verify Buy & Hold return statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 105, testCase: 'Verify Final Equity statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 106, testCase: 'Verify Number of Trades statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 107, testCase: 'Verify Win Rate statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 108, testCase: 'Verify Profit Factor statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 109, testCase: 'Verify Max Drawdown statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 110, testCase: 'Verify Average Trade statistic is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 111, testCase: 'Verify equity curve chart is displayed when backtest completes', priority: 'Critical' },
      { tcNumber: 112, testCase: 'Verify buy & hold equity curve is displayed for comparison when backtest completes', priority: 'Critical' },
      { tcNumber: 113, testCase: 'Verify per-stock transaction details are accessible when user clicks stock row in backtest results', priority: 'High' },
    ],
  },
  {
    moduleNumber: 12,
    moduleName: 'Export and Download',
    relatedFeatures: ['F16'],
    testCases: [
      { tcNumber: 114, testCase: 'Verify screening results can be downloaded as CSV when user clicks Export on Premium plan', priority: 'High' },
      { tcNumber: 115, testCase: 'Verify screening results can be downloaded as Excel when user clicks Export on Premium plan', priority: 'High' },
      { tcNumber: 116, testCase: 'Verify free user cannot export results when user is on Free plan', priority: 'High' },
      { tcNumber: 117, testCase: 'Verify upgrade prompt is shown when free user attempts export', priority: 'High' },
    ],
  },
  {
    moduleNumber: 13,
    moduleName: 'Save and Load Screener',
    relatedFeatures: ['F17'],
    testCases: [
      { tcNumber: 118, testCase: 'Verify screener configuration is saved when user saves screener', priority: 'Critical' },
      { tcNumber: 119, testCase: 'Verify saved screener is loaded when user loads saved screener', priority: 'Critical' },
      { tcNumber: 120, testCase: 'Verify saved screener name is updated when user renames screener', priority: 'High' },
      { tcNumber: 121, testCase: 'Verify saved screener is deleted when user deletes screener', priority: 'High' },
      { tcNumber: 122, testCase: 'Verify saved screener persists across sessions when user saves screener', priority: 'Critical' },
    ],
  },
  {
    moduleNumber: 14,
    moduleName: 'Real-time and Delayed Data',
    relatedFeatures: ['F18'],
    testCases: [
      { tcNumber: 123, testCase: 'Verify real-time data is displayed when premium user selects real-time option', priority: 'Critical' },
      { tcNumber: 124, testCase: 'Verify delayed data is displayed when free user accesses screener', priority: 'Critical' },
      { tcNumber: 125, testCase: 'Verify data status is clearly indicated when user views data', priority: 'Critical' },
      { tcNumber: 126, testCase: 'Verify delayed data is displayed when real-time feed fails', priority: 'High' },
      { tcNumber: 127, testCase: 'Verify screener continues operating with delayed data when real-time feed fails', priority: 'High' },
    ],
  },
  {
    moduleNumber: 15,
    moduleName: 'Data Accuracy and Calculation',
    relatedFeatures: ['F7', 'F8'],
    testCases: [
      { tcNumber: 128, testCase: 'Verify fundamental metrics match licensed data source when displayed', priority: 'Critical' },
      { tcNumber: 129, testCase: 'Verify technical indicators are reproducible when calculated', priority: 'Critical' },
      { tcNumber: 130, testCase: 'Verify nominal change is calculated as last minus previous close when displayed', priority: 'Critical' },
      { tcNumber: 131, testCase: 'Verify percentage change is calculated as nominal divided by previous close times 100 when displayed', priority: 'Critical' },
      { tcNumber: 132, testCase: 'Verify nominal change follows IDX tick-size rules when calculated', priority: 'Critical' },
      { tcNumber: 133, testCase: 'Verify backtest avoids look-ahead bias when simulated', priority: 'Critical' },
      { tcNumber: 134, testCase: 'Verify zero change is displayed as 0 (0%) in orange when price unchanged', priority: 'Medium' },
      { tcNumber: 135, testCase: 'Verify result freshness is indicated when feed is delayed', priority: 'Medium' },
    ],
  },
  {
    moduleNumber: 16,
    moduleName: 'Alerts',
    relatedFeatures: ['F19'],
    testCases: [
      { tcNumber: 136, testCase: 'Verify alert is created when user sets alert from screener criteria', priority: 'Medium' },
      { tcNumber: 137, testCase: 'Verify notification is triggered when stock enters screener criteria with active alert', priority: 'Medium' },
    ],
  },
  {
    moduleNumber: 17,
    moduleName: 'UI States and Localization',
    relatedFeatures: ['F20'],
    testCases: [
      { tcNumber: 138, testCase: 'Verify empty state is displayed when screening yields no results', priority: 'Critical' },
      { tcNumber: 139, testCase: 'Verify loading state is displayed when screening is in progress', priority: 'Critical' },
      { tcNumber: 140, testCase: 'Verify error state is displayed with recovery option when error occurs', priority: 'Critical' },
      { tcNumber: 141, testCase: 'Verify all labels are available in English when user selects English language', priority: 'High' },
      { tcNumber: 142, testCase: 'Verify all labels are available in Indonesian when user selects Indonesian language', priority: 'High' },
      { tcNumber: 143, testCase: 'Verify disclaimer is displayed in English when disclaimer shown', priority: 'High' },
      { tcNumber: 144, testCase: 'Verify disclaimer is displayed in Indonesian when disclaimer shown', priority: 'High' },
      { tcNumber: 145, testCase: 'Verify data source disclaimer is displayed when screening results are shown', priority: 'Critical' },
      { tcNumber: 146, testCase: 'Verify non-advice disclaimer is displayed when screening results are shown', priority: 'Critical' },
      { tcNumber: 147, testCase: 'Verify non-advice disclaimer is displayed when presets are shown', priority: 'Critical' },
      { tcNumber: 148, testCase: 'Verify non-advice disclaimer is displayed when backtest results are shown', priority: 'Critical' },
      { tcNumber: 149, testCase: 'Verify timestamp is displayed when data is stale', priority: 'Medium' },
    ],
  },
  {
    moduleNumber: 18,
    moduleName: 'Free vs Premium Feature Gating',
    relatedFeatures: ['F2', 'F4', 'F11', 'F16', 'F18'],
    testCases: [
      { tcNumber: 150, testCase: 'Verify free user can access Popular screening when using Free plan', priority: 'Critical' },
      { tcNumber: 151, testCase: 'Verify free user can access Technical screening when using Free plan', priority: 'Critical' },
      { tcNumber: 152, testCase: 'Verify free user can access built-in presets when using Free plan', priority: 'Critical' },
      { tcNumber: 153, testCase: 'Verify free user can access result table and pagination when using Free plan', priority: 'Critical' },
      { tcNumber: 154, testCase: 'Verify free user can access Stock Detail when using Free plan', priority: 'Critical' },
      { tcNumber: 155, testCase: 'Verify free user can access Index universe only when using Free plan', priority: 'High' },
      { tcNumber: 156, testCase: 'Verify free user can save maximum 1 custom preset when using Free plan', priority: 'High' },
      { tcNumber: 157, testCase: 'Verify free user can open backtest with locked basket when using Free plan', priority: 'High' },
      { tcNumber: 158, testCase: 'Verify free user can access backtest 6M period only when using Free plan', priority: 'High' },
      { tcNumber: 159, testCase: 'Verify premium user can access real-time data when using Premium plan', priority: 'Critical' },
      { tcNumber: 160, testCase: 'Verify premium user can access Watchlist universe when using Premium plan', priority: 'High' },
      { tcNumber: 161, testCase: 'Verify premium user can access Portfolio universe when using Premium plan', priority: 'High' },
      { tcNumber: 162, testCase: 'Verify premium user can save unlimited presets when using Premium plan', priority: 'High' },
      { tcNumber: 163, testCase: 'Verify premium user can edit backtest basket when using Premium plan', priority: 'High' },
      { tcNumber: 164, testCase: 'Verify premium user can access 6M, 1Y, 3Y, 5Y backtest periods when using Premium plan', priority: 'High' },
      { tcNumber: 165, testCase: 'Verify premium user can export results when using Premium plan', priority: 'High' },
      { tcNumber: 166, testCase: 'Verify upgrade prompt is shown for restricted features when free user attempts access', priority: 'Critical' },
      { tcNumber: 167, testCase: 'Verify feature gating is enforced server-side when user attempts to access restricted features', priority: 'Critical' },
    ],
  },
  {
    moduleNumber: 19,
    moduleName: 'Analytics and Audit',
    relatedFeatures: ['F21'],
    testCases: [
      { tcNumber: 168, testCase: 'Verify screener run is logged when user executes screening', priority: 'High' },
      { tcNumber: 169, testCase: 'Verify backtest run is logged when user executes backtest', priority: 'High' },
      { tcNumber: 170, testCase: 'Verify save action is logged when user saves screener or preset', priority: 'High' },
      { tcNumber: 171, testCase: 'Verify load action is logged when user loads screener or preset', priority: 'High' },
      { tcNumber: 172, testCase: 'Verify user interactions are logged for analytics when user uses screener', priority: 'High' },
    ],
  },
]

/**
 * Convert PRD test modules to TestCase array format for display
 */
export function convertModulesToTestCases(modules: ModuleData[]) {
  const testCases = []
  for (const module of modules) {
    for (const tc of module.testCases) {
      testCases.push({
        tcId: `TC-${String(tc.tcNumber).padStart(3, '0')}`,
        suite: `Module ${module.moduleNumber} - ${module.moduleName}`,
        title: tc.testCase,
        priority: tc.priority,
      })
    }
  }
  return testCases
}
