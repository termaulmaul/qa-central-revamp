/**
 * Comprehensive Test Case Mapping for Stock Screener
 * Generates 172 test cases across 19 modules from PRD features
 * 
 * MODULE BREAKDOWN:
 * M1-5: Navigation, Filtering, Data Display, Presets (40 cases)
 * M6-9: Builder, Universe, Period, Results (40 cases)
 * M10-14: Backtest, Export, Save/Load, Data Type (67 cases)
 * M15-19: Data Accuracy, Alerts, UI/i18n, Gating, Analytics (25 cases)
 */

export const COMPREHENSIVE_TEST_MAPPING = {
  // ============ MODULE 1-5: SCREENING SETUP ============
  
  // Module 1: Screening Navigation (5 cases) - F1
  "M1": {
    name: "Screening Navigation and Entry Points",
    feature: "F1",
    cases: [
      { tc: 1, title: "Verify Stock Screener page opens when user navigates from Market page" },
      { tc: 2, title: "Verify Popular tab displays fundamental data when user selects Popular tab" },
      { tc: 3, title: "Verify Technical tab displays technical screening interface when user selects Technical tab" },
      { tc: 4, title: "Verify search results are displayed when user searches stock by name in Popular tab" },
      { tc: 5, title: "Verify stock detail page opens when user clicks row in result table" },
    ]
  },

  // Module 2: Basic Filtering (10 cases) - F2, F7
  "M2": {
    name: "Basic and Fundamental Filtering",
    feature: "F2,F7",
    cases: [
      { tc: 6, title: "Verify filter is added via Add Filter button when user selects filter field in Popular tab" },
      { tc: 7, title: "Verify max 10 filters are applied when user adds filters in Popular tab" },
      { tc: 8, title: "Verify numeric range filter is applied when user enters min-max values for numerical filters" },
      { tc: 9, title: "Verify sector filter is applied when user selects sector value from dropdown" },
      { tc: 10, title: "Verify industry filter is applied when user selects industry value from dropdown" },
      { tc: 11, title: "Verify filter is removed when user deletes active filter" },
      { tc: 12, title: "Verify active filter count is displayed on badge when filters are applied" },
      { tc: 13, title: "Verify Price per Lot filter is applied when user enters min-max value" },
      { tc: 14, title: "Verify Day Change percentage filter is applied when user enters min-max value" },
      { tc: 15, title: "Verify Day Change Rupiah filter is applied when user enters min-max value" },
    ]
  },

  // Module 3: Fundamental Data Display (11 cases) - F1
  "M3": {
    name: "Fundamental Data Display",
    feature: "F1",
    cases: [
      { tc: 16, title: "Verify list of stocks with fundamental data is displayed when user views Popular tab" },
      { tc: 17, title: "Verify sector information is displayed for each stock when viewing Popular tab" },
      { tc: 18, title: "Verify industry information is displayed for each stock when viewing Popular tab" },
      { tc: 19, title: "Verify market capitalization is displayed for each stock when viewing Popular tab" },
      { tc: 20, title: "Verify yearly P/E ratio is displayed for each stock when viewing Popular tab" },
      { tc: 21, title: "Verify quarterly P/E ratio is displayed for each stock when viewing Popular tab" },
      { tc: 22, title: "Verify price per lot is displayed for each stock when viewing Popular tab" },
      { tc: 23, title: "Verify day change percentage is displayed for each stock when viewing Popular tab" },
      { tc: 24, title: "Verify day change Rupiah is displayed for each stock when viewing Popular tab" },
      { tc: 25, title: "Verify net income is displayed for each stock when viewing Popular tab" },
      { tc: 26, title: "Verify dividend information is displayed for each stock when viewing Popular tab" },
    ]
  },

  // Module 4: Technical Presets (8 cases) - F3
  "M4": {
    name: "Technical Screening Presets",
    feature: "F3",
    cases: [
      { tc: 27, title: "Verify RSI Oversold preset is applied when user selects RSI Oversold preset" },
      { tc: 28, title: "Verify RSI Overbought preset is applied when user selects RSI Overbought preset" },
      { tc: 29, title: "Verify MACD Bullish preset is applied when user selects MACD Bullish preset" },
      { tc: 30, title: "Verify Stoch Oversold preset is applied when user selects Stoch Oversold preset" },
      { tc: 31, title: "Verify Volume Surge preset is applied when user selects Volume Surge preset" },
      { tc: 32, title: "Verify Strong Trend preset is applied when user selects Strong Trend preset" },
      { tc: 33, title: "Verify MACD Crossover preset is applied when user selects MACD Crossover preset" },
      { tc: 34, title: "Verify additional presets are visible when user scrolls preset list" },
    ]
  },

  // Module 5: Custom Presets (6 cases) - F4
  "M5": {
    name: "Custom Preset Management",
    feature: "F4",
    cases: [
      { tc: 35, title: "Verify custom preset is saved when user clicks Save preset and enters name" },
      { tc: 36, title: "Verify custom preset name is updated when user renames saved preset" },
      { tc: 37, title: "Verify custom preset is deleted when user deletes saved preset" },
      { tc: 38, title: "Verify custom preset persists across sessions when user saves preset" },
      { tc: 39, title: "Verify free user can save maximum 1 custom preset when user is on Free plan" },
      { tc: 40, title: "Verify premium user can save unlimited presets when user is on Premium plan" },
    ]
  },

  // ============ MODULE 6-9: FILTERING & RESULTS ============

  // Module 6: Condition Builder (7 cases) - F5
  "M6": {
    name: "Technical Condition Builder",
    feature: "F5",
    cases: [
      { tc: 41, title: "Verify technical condition is added when user selects field, operator, and value in Condition Builder" },
      { tc: 42, title: "Verify condition field can be selected from available technical indicators when user builds condition" },
      { tc: 43, title: "Verify operator can be selected from available operators when user builds condition" },
      { tc: 44, title: "Verify value can be entered as number or another field when user builds condition" },
      { tc: 45, title: "Verify maximum 3 technical conditions can be added when user builds conditions" },
      { tc: 46, title: "Verify condition is removed when user deletes condition from Condition Builder" },
      { tc: 47, title: "Verify screening runs when user clicks Run Screen after building conditions" },
    ]
  },

  // Module 7: Universe Selection (17 cases) - F6
  "M7": {
    name: "Universe Selection",
    feature: "F6",
    cases: [
      { tc: 48, title: "Verify Index universe is displayed when user selects Index sub-tab" },
      { tc: 49, title: "Verify Watchlist universe is displayed when user selects Watchlist sub-tab" },
      { tc: 50, title: "Verify Portfolio universe is displayed when user selects Portfolio sub-tab" },
      { tc: 51, title: "Verify LQ45 index list is available when user selects Index dropdown" },
      { tc: 52, title: "Verify IDX30 index list is available when user selects Index dropdown" },
      { tc: 53, title: "Verify IDX80 index list is available when user selects Index dropdown" },
      { tc: 54, title: "Verify KOMPAS100 index list is available when user selects Index dropdown" },
      { tc: 55, title: "Verify IDX Energy index list is available when user selects Index dropdown" },
      { tc: 56, title: "Verify IDX Financials index list is available when user selects Index dropdown" },
      { tc: 57, title: "Verify IDX Consumer index list is available when user selects Index dropdown" },
      { tc: 58, title: "Verify JII index list is available when user selects Index dropdown" },
      { tc: 59, title: "Verify IDXBUMN20 index list is available when user selects Index dropdown" },
      { tc: 60, title: "Verify user's watchlists are available when user selects Watchlist dropdown" },
      { tc: 61, title: "Verify free user cannot access Watchlist universe when user is on Free plan" },
      { tc: 62, title: "Verify free user cannot access Portfolio universe when user is on Free plan" },
      { tc: 63, title: "Verify premium user can access Watchlist universe when user is on Premium plan" },
      { tc: 64, title: "Verify premium user can access Portfolio universe when user is on Premium plan" },
    ]
  },

  // Module 8: Period Selection (6 cases) - F10
  "M8": {
    name: "Period Selection",
    feature: "F10",
    cases: [
      { tc: 65, title: "Verify 1D data period is selectable when user chooses period option" },
      { tc: 66, title: "Verify 1W data period is selectable when user chooses period option" },
      { tc: 67, title: "Verify 1M data period is selectable when user chooses period option" },
      { tc: 68, title: "Verify 3M data period is selectable when user chooses period option" },
      { tc: 69, title: "Verify 6M data period is selectable when user chooses period option" },
      { tc: 70, title: "Verify 1Y data period is selectable when user chooses period option" },
    ]
  },

  // Module 9: Result Table (10 cases) - F9
  "M9": {
    name: "Result Table and Pagination",
    feature: "F9",
    cases: [
      { tc: 71, title: "Verify ticker is displayed in result table when screening completes" },
      { tc: 72, title: "Verify last price is displayed in result table when screening completes" },
      { tc: 73, title: "Verify change nominal is displayed in result table when screening completes" },
      { tc: 74, title: "Verify change percentage is displayed in result table when screening completes" },
      { tc: 75, title: "Verify volume is displayed in result table when screening completes" },
      { tc: 76, title: "Verify optional indicator columns are displayed in result table when configured" },
      { tc: 77, title: "Verify table is sortable by each column when user clicks column header" },
      { tc: 78, title: "Verify max 10 tickers are displayed per page when results are shown" },
      { tc: 79, title: "Verify user can navigate to next page when pagination is used" },
      { tc: 80, title: "Verify user can navigate to previous page when pagination is used" },
    ]
  },

  // ============ MODULE 10-14: BACKTEST & DATA ============

  // Module 10: Backtest Configuration (22 cases) - F11, F12, F13, F14
  "M10": {
    name: "Backtest Configuration and Execution",
    feature: "F11,F12,F13,F14",
    cases: [
      { tc: 81, title: "Verify Backtest page opens when user clicks Backtest button on screening results" },
      { tc: 82, title: "Verify basket contains all screening result stocks when backtest is opened" },
      { tc: 83, title: "Verify stock can be removed from basket when user deletes stock from basket" },
      { tc: 84, title: "Verify stock can be added to basket from universe when user adds stock to basket" },
      { tc: 85, title: "Verify basket resets to screening results when user clicks reset button" },
      { tc: 86, title: "Verify backtest strategy automatically uses screening conditions when backtest is opened" },
      { tc: 87, title: "Verify strategy condition can be added when user edits backtest strategy" },
      { tc: 88, title: "Verify strategy condition can be changed when user edits backtest strategy" },
      { tc: 89, title: "Verify strategy condition can be deleted when user edits backtest strategy" },
      { tc: 90, title: "Verify max 3 strategy conditions are allowed when user edits backtest strategy" },
      { tc: 91, title: "Verify entry occurs when all strategy conditions are met during backtest simulation" },
      { tc: 92, title: "Verify exit occurs when strategy conditions are no longer met during backtest simulation" },
      { tc: 93, title: "Verify 6M backtest period is selectable when user chooses backtest period" },
      { tc: 94, title: "Verify 1Y backtest period is selectable when user chooses backtest period" },
      { tc: 95, title: "Verify 3Y backtest period is selectable when user chooses backtest period" },
      { tc: 96, title: "Verify 5Y backtest period is selectable when user chooses backtest period" },
      { tc: 97, title: "Verify initial capital can be entered when user sets up backtest" },
      { tc: 98, title: "Verify backtest runs when user clicks Run backtest button" },
      { tc: 99, title: "Verify free user can only access 6M backtest period when user is on Free plan" },
      { tc: 100, title: "Verify free user basket is locked and cannot be edited when user is on Free plan" },
      { tc: 101, title: "Verify premium user can access 6M, 1Y, 3Y, 5Y backtest periods when user is on Premium plan" },
      { tc: 102, title: "Verify premium user basket is editable when user is on Premium plan" },
    ]
  },

  // Module 11: Backtest Results (11 cases) - F14, F15
  "M11": {
    name: "Backtest Results Display",
    feature: "F14,F15",
    cases: [
      { tc: 103, title: "Verify Total Return statistic is displayed when backtest completes" },
      { tc: 104, title: "Verify Buy & Hold return statistic is displayed when backtest completes" },
      { tc: 105, title: "Verify Final Equity statistic is displayed when backtest completes" },
      { tc: 106, title: "Verify Number of Trades statistic is displayed when backtest completes" },
      { tc: 107, title: "Verify Win Rate statistic is displayed when backtest completes" },
      { tc: 108, title: "Verify Profit Factor statistic is displayed when backtest completes" },
      { tc: 109, title: "Verify Max Drawdown statistic is displayed when backtest completes" },
      { tc: 110, title: "Verify Average Trade statistic is displayed when backtest completes" },
      { tc: 111, title: "Verify equity curve chart is displayed when backtest completes" },
      { tc: 112, title: "Verify buy & hold equity curve is displayed for comparison when backtest completes" },
      { tc: 113, title: "Verify per-stock transaction details are accessible when user clicks stock row in backtest results" },
    ]
  },

  // Module 12: Export (4 cases) - F16
  "M12": {
    name: "Export and Download",
    feature: "F16",
    cases: [
      { tc: 114, title: "Verify screening results can be downloaded as CSV when user clicks Export on Premium plan" },
      { tc: 115, title: "Verify screening results can be downloaded as Excel when user clicks Export on Premium plan" },
      { tc: 116, title: "Verify free user cannot export results when user is on Free plan" },
      { tc: 117, title: "Verify upgrade prompt is shown when free user attempts export" },
    ]
  },

  // Module 13: Save & Load (5 cases) - F17
  "M13": {
    name: "Save and Load Screener",
    feature: "F17",
    cases: [
      { tc: 118, title: "Verify screener configuration is saved when user saves screener" },
      { tc: 119, title: "Verify saved screener is loaded when user loads saved screener" },
      { tc: 120, title: "Verify saved screener name is updated when user renames screener" },
      { tc: 121, title: "Verify saved screener is deleted when user deletes screener" },
      { tc: 122, title: "Verify saved screener persists across sessions when user saves screener" },
    ]
  },

  // Module 14: Real-time/Delayed (5 cases) - F18
  "M14": {
    name: "Real-time and Delayed Data",
    feature: "F18",
    cases: [
      { tc: 123, title: "Verify real-time data is displayed when premium user selects real-time option" },
      { tc: 124, title: "Verify delayed data is displayed when free user accesses screener" },
      { tc: 125, title: "Verify data status is clearly indicated when user views data" },
      { tc: 126, title: "Verify delayed data is displayed when real-time feed fails" },
      { tc: 127, title: "Verify screener continues operating with delayed data when real-time feed fails" },
    ]
  },

  // ============ MODULE 15-19: QUALITY & GATING ============

  // Module 15: Data Accuracy (8 cases) - F7, F8
  "M15": {
    name: "Data Accuracy and Calculation",
    feature: "F7,F8",
    cases: [
      { tc: 128, title: "Verify fundamental metrics match licensed data source when displayed" },
      { tc: 129, title: "Verify technical indicators are reproducible when calculated" },
      { tc: 130, title: "Verify nominal change is calculated as last minus previous close when displayed" },
      { tc: 131, title: "Verify percentage change is calculated as nominal divided by previous close times 100 when displayed" },
      { tc: 132, title: "Verify nominal change follows IDX tick-size rules when calculated" },
      { tc: 133, title: "Verify backtest avoids look-ahead bias when simulated" },
      { tc: 134, title: "Verify zero change is displayed as 0 (0%) in orange when price unchanged" },
      { tc: 135, title: "Verify result freshness is indicated when feed is delayed" },
    ]
  },

  // Module 16: Alerts (2 cases) - F19
  "M16": {
    name: "Alerts",
    feature: "F19",
    cases: [
      { tc: 136, title: "Verify alert is created when user sets alert from screener criteria" },
      { tc: 137, title: "Verify notification is triggered when stock enters screener criteria with active alert" },
    ]
  },

  // Module 17: UI States & i18n (12 cases) - F20
  "M17": {
    name: "UI States and Localization",
    feature: "F20",
    cases: [
      { tc: 138, title: "Verify empty state is displayed when screening yields no results" },
      { tc: 139, title: "Verify loading state is displayed when screening is in progress" },
      { tc: 140, title: "Verify error state is displayed with recovery option when error occurs" },
      { tc: 141, title: "Verify all labels are available in English when user selects English language" },
      { tc: 142, title: "Verify all labels are available in Indonesian when user selects Indonesian language" },
      { tc: 143, title: "Verify disclaimer is displayed in English when disclaimer shown" },
      { tc: 144, title: "Verify disclaimer is displayed in Indonesian when disclaimer shown" },
      { tc: 145, title: "Verify data source disclaimer is displayed when screening results are shown" },
      { tc: 146, title: "Verify non-advice disclaimer is displayed when screening results are shown" },
      { tc: 147, title: "Verify non-advice disclaimer is displayed when presets are shown" },
      { tc: 148, title: "Verify non-advice disclaimer is displayed when backtest results are shown" },
      { tc: 149, title: "Verify timestamp is displayed when data is stale" },
    ]
  },

  // Module 18: Feature Gating (18 cases) - F2B (Free vs Premium)
  "M18": {
    name: "Free vs Premium Feature Gating",
    feature: "Free/Premium",
    cases: [
      { tc: 150, title: "Verify free user can access Popular screening when using Free plan" },
      { tc: 151, title: "Verify free user can access Technical screening when using Free plan" },
      { tc: 152, title: "Verify free user can access built-in presets when using Free plan" },
      { tc: 153, title: "Verify free user can access result table and pagination when using Free plan" },
      { tc: 154, title: "Verify free user can access Stock Detail when using Free plan" },
      { tc: 155, title: "Verify free user can access Index universe only when using Free plan" },
      { tc: 156, title: "Verify free user can save maximum 1 custom preset when using Free plan" },
      { tc: 157, title: "Verify free user can open backtest with locked basket when using Free plan" },
      { tc: 158, title: "Verify free user can access backtest 6M period only when using Free plan" },
      { tc: 159, title: "Verify premium user can access real-time data when using Premium plan" },
      { tc: 160, title: "Verify premium user can access Watchlist universe when using Premium plan" },
      { tc: 161, title: "Verify premium user can access Portfolio universe when using Premium plan" },
      { tc: 162, title: "Verify premium user can save unlimited presets when using Premium plan" },
      { tc: 163, title: "Verify premium user can edit backtest basket when using Premium plan" },
      { tc: 164, title: "Verify premium user can access 6M, 1Y, 3Y, 5Y backtest periods when using Premium plan" },
      { tc: 165, title: "Verify premium user can export results when using Premium plan" },
      { tc: 166, title: "Verify upgrade prompt is shown for restricted features when free user attempts access" },
      { tc: 167, title: "Verify feature gating is enforced server-side when user attempts to access restricted features" },
    ]
  },

  // Module 19: Analytics & Audit (5 cases) - F21
  "M19": {
    name: "Analytics and Audit",
    feature: "F21",
    cases: [
      { tc: 168, title: "Verify screener run is logged when user executes screening" },
      { tc: 169, title: "Verify backtest run is logged when user executes backtest" },
      { tc: 170, title: "Verify save action is logged when user saves screener or preset" },
      { tc: 171, title: "Verify load action is logged when user loads screener or preset" },
      { tc: 172, title: "Verify user interactions are logged for analytics when user uses screener" },
    ]
  },
}

export function getComprehensiveTestCases() {
  const allCases: Array<{
    module: string
    moduleNum: number
    title: string
    feature: string
    tc: number
    caseName: string
    priority: 'Critical' | 'High' | 'Medium'
  }> = []

  for (const [key, module] of Object.entries(COMPREHENSIVE_TEST_MAPPING)) {
    const moduleNum = parseInt(key.replace('M', ''))
    
    for (const testCase of (module as any).cases) {
      // Assign priority based on importance
      let priority: 'Critical' | 'High' | 'Medium' = 'High'
      
      // Critical: Navigation, key features, data, gating
      if (moduleNum <= 5 || moduleNum >= 15 || testCase.tc % 10 === 0) {
        priority = 'Critical'
      }
      // High: Feature operations, backtest
      else if (moduleNum === 10 || moduleNum === 11 || moduleNum === 18) {
        priority = 'High'
      }
      // Medium: Edge cases, optional features
      else {
        priority = 'Medium'
      }

      allCases.push({
        module: (module as any).name,
        moduleNum,
        title: testCase.title,
        feature: (module as any).feature,
        tc: testCase.tc,
        caseName: `TC-${String(testCase.tc).padStart(3, '0')}`,
        priority
      })
    }
  }

  return allCases
}
