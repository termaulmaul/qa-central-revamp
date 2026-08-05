/**
 * ENHANCED STRICT PRD PARSER - Generates BOTH Positive AND Negative test cases
 * With comprehensive test type classification per QA standard
 * 
 * Test Types:
 * - Functional · Logic/Flow: Happy path, feature workflows
 * - Functional · Transaction: Data persistence, state management
 * - E2E: Multi-step cross-feature workflows (Screening → Backtest → Results)
 * - API / Data Integration: Real-time feeds, data synchronization, external APIs
 * - Security: Feature gating, permission validation, token/auth checks
 * - Analytics/Tracking: Event logging, data accuracy, audit trails
 */

interface PRDTestCase {
  tcId: string
  title: string
  priority: 'P0' | 'P1' | 'P2'
  behavior: 'Positive' | 'Negative' // Happy path vs Error scenario
  testType: 'Functional · Logic/Flow' | 'Functional · Transaction' | 'E2E' | 'API / Data Integration' | 'Security' | 'Analytics/Tracking'
  sourceReference: string
}

interface PRDModule {
  moduleNum: number
  name: string
  testCases: PRDTestCase[]
  sourceSection: string
}

/**
 * Generate ALL test cases - Positive + Negative - with proper test types
 */
export function getEnhancedTestCases(): PRDModule[] {
  const modules: PRDModule[] = []

  // MODULE 1: User Access & Navigation
  modules.push({
    moduleNum: 1,
    name: 'User Access & Navigation',
    sourceSection: 'User Stories',
    testCases: [
      {
        tcId: 'TC-001',
        title: 'Verify Stock Screener page opens when user navigates from Market page',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'User Story: "membuka Stock Screener dari halaman Market"',
      },
      {
        tcId: 'TC-002',
        title: 'Verify error message displays when user tries to access Stock Screener without login',
        priority: 'P0',
        behavior: 'Negative',
        testType: 'Security',
        sourceReference: 'Acceptance Criteria: "User must be authenticated to access screener"',
      },
      {
        tcId: 'TC-003',
        title: 'Verify all tabs (Popular, Technical, Custom) are visible when user opens Stock Screener',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'Feature: F1/F3/F4 - Multiple screener types available',
      },
    ],
  })

  // MODULE 2: Basic Filtering
  modules.push({
    moduleNum: 2,
    name: 'Basic Filtering (Price, Volume, Change, Market Cap, Sector)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-004',
        title: 'Verify basic filters apply correctly when user selects price range 1000-5000',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F2: "User dapat menambahkan filter (maksimal 10)"',
      },
      {
        tcId: 'TC-005',
        title: 'Verify error occurs when user enters invalid min-max values (min > max)',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'Acceptance Criteria: "Validate min ≤ max before applying filter"',
      },
      {
        tcId: 'TC-006',
        title: 'Verify max 10 filters constraint when user adds 11th filter',
        priority: 'P0',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F2: "maksimal 10" - explicitly states limit',
      },
      {
        tcId: 'TC-007',
        title: 'Verify "Add Filter" button disabled when maximum 10 filters reached',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F2: "maksimal 10"',
      },
    ],
  })

  // MODULE 3: Fundamental Filtering
  modules.push({
    moduleNum: 3,
    name: 'Fundamental Filtering (PER, PBV, ROE, Growth, DER, Dividend Yield)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-008',
        title: 'Verify fundamental metrics filter works when user applies PER 10-20, PBV 1-3',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F7: "User dapat menyaring berdasarkan kriteria fundamental"',
      },
      {
        tcId: 'TC-009',
        title: 'Verify data accuracy when fundamental metrics display PER values from real-time source',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'API / Data Integration',
        sourceReference: 'F3/F18: "Real-time/Delayed data integration"',
      },
    ],
  })

  // MODULE 4: Technical Indicators & Presets
  modules.push({
    moduleNum: 4,
    name: 'Technical Indicators & Presets',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-010',
        title: 'Verify technical preset applies all indicators when user selects "Moving Average Crossover" preset',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F3: "User dapat memilih preset strategi teknikal"',
      },
      {
        tcId: 'TC-011',
        title: 'Verify preset results match when comparing manual indicator setup vs preset',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F3: Preset consistency validation',
      },
    ],
  })

  // MODULE 5: Custom Preset Management
  modules.push({
    moduleNum: 5,
    name: 'Custom Preset Save/Load/Delete',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-012',
        title: 'Verify custom preset saves when user enters name and clicks Save',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F4: "User dapat menyimpan preset"',
      },
      {
        tcId: 'TC-013',
        title: 'Verify custom preset persists across sessions when user closes and reopens app',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F4: "Preset tersimpan antar sesi"',
      },
      {
        tcId: 'TC-014',
        title: 'Verify error message displays when user saves preset with duplicate name',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F4: Duplicate name validation',
      },
      {
        tcId: 'TC-015',
        title: 'Verify preset deletes successfully when user confirms deletion',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F4: "User dapat delete"',
      },
    ],
  })

  // MODULE 6: Condition Builder
  modules.push({
    moduleNum: 6,
    name: 'Condition Builder (Max 3 Conditions)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-016',
        title: 'Verify condition builder creates AND/OR logic when user adds 2 conditions',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F5: "User dapat menyusun kondisi teknikal (maksimal 3)"',
      },
      {
        tcId: 'TC-017',
        title: 'Verify max 3 conditions enforced when user tries to add 4th condition',
        priority: 'P0',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F5: "maksimal 3 kondisi"',
      },
      {
        tcId: 'TC-018',
        title: 'Verify "Add Condition" button disabled at max 3 conditions',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F5: "maksimal 3"',
      },
    ],
  })

  // MODULE 7: Universe Selection
  modules.push({
    moduleNum: 7,
    name: 'Universe Selection (Index/Watchlist/Portfolio)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-019',
        title: 'Verify universe filters results when user selects "IDX LQ45" index',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F6: "User dapat memilih universe (Index/Watchlist/Portfolio)"',
      },
      {
        tcId: 'TC-020',
        title: 'Verify error displays when user tries to select empty watchlist as universe',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F6: Validation for empty universe',
      },
    ],
  })

  // MODULE 8: Result Table & Sorting & Pagination
  modules.push({
    moduleNum: 8,
    name: 'Result Table, Sorting & Pagination',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-021',
        title: 'Verify results table displays with sortable columns when user opens result page',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F9: "User dapat mengurutkan per kolom"',
      },
      {
        tcId: 'TC-022',
        title: 'Verify pagination limits results to 10 per page when user views result table',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F9: "Maksimum 10 per halaman"',
      },
      {
        tcId: 'TC-023',
        title: 'Verify sort order toggles ASC/DESC when user clicks column header twice',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F9: Sorting behavior',
      },
      {
        tcId: 'TC-024',
        title: 'Verify error handling when pagination page number exceeds total pages',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F9: Pagination validation',
      },
    ],
  })

  // MODULE 9: Period Selection
  modules.push({
    moduleNum: 9,
    name: 'Period Selection (1D/1W/1M/3M/6M/1Y)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-025',
        title: 'Verify data refreshes when user changes period from 1D to 1W',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'API / Data Integration',
        sourceReference: 'F10: "User dapat memilih periode data"',
      },
      {
        tcId: 'TC-026',
        title: 'Verify historical data accuracy for 1Y period from real-time source',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'API / Data Integration',
        sourceReference: 'F10/F18: Data source validation',
      },
    ],
  })

  // MODULE 10: Backtest Basket Configuration
  modules.push({
    moduleNum: 10,
    name: 'Backtest Basket Configuration',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-027',
        title: 'Verify backtest basket builds when user selects stocks and initializes backtest',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'E2E',
        sourceReference: 'F11/F12: "User dapat membacktest hasil screening"',
      },
      {
        tcId: 'TC-028',
        title: 'Verify user can remove individual stocks from backtest basket',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F12: "User dapat menghapus saham"',
      },
      {
        tcId: 'TC-029',
        title: 'Verify user can add additional stocks to backtest basket',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F12: "User dapat menambahkan saham"',
      },
      {
        tcId: 'TC-030',
        title: 'Verify error occurs when user tries to run backtest with empty basket',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F12: Validation for empty basket',
      },
    ],
  })

  // MODULE 11: Backtest Strategy Configuration
  modules.push({
    moduleNum: 11,
    name: 'Backtest Strategy Editing (Max 3 Conditions)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-031',
        title: 'Verify backtest strategy updates when user modifies entry/exit conditions',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F13: "User dapat mengedit strategi backtest (maksimal 3 kondisi)"',
      },
      {
        tcId: 'TC-032',
        title: 'Verify max 3 conditions enforced when editing backtest strategy',
        priority: 'P0',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F13: "maksimal 3 kondisi"',
      },
    ],
  })

  // MODULE 12: Backtest Results & Statistics
  modules.push({
    moduleNum: 12,
    name: 'Backtest Results & Statistics Display',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-033',
        title: 'Verify backtest results display statistics (win rate, ROI, max drawdown) when run completes',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F14: "User dapat melihat statistik hasil backtest"',
      },
      {
        tcId: 'TC-034',
        title: 'Verify backtest calculation accuracy when results match expected values',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F14: Statistical validation',
      },
      {
        tcId: 'TC-035',
        title: 'Verify transaction details show individual trades in backtest results',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F15: "User dapat melihat rincian transaksi"',
      },
    ],
  })

  // MODULE 13: Export Results
  modules.push({
    moduleNum: 13,
    name: 'Export Results (CSV/Excel)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-036',
        title: 'Verify results export as CSV when user clicks Export button',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F16: "User dapat download hasil screening"',
      },
      {
        tcId: 'TC-037',
        title: 'Verify export file contains all columns when user downloads result set',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F16: Export completeness validation',
      },
      {
        tcId: 'TC-038',
        title: 'Verify access denied when free user tries to export large result set (>1000 rows)',
        priority: 'P0',
        behavior: 'Negative',
        testType: 'Security',
        sourceReference: 'F16/F18: Feature gating for free tier',
      },
    ],
  })

  // MODULE 14: Save/Load/Delete Screeners
  modules.push({
    moduleNum: 14,
    name: 'Save/Load/Delete Screener Configurations',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-039',
        title: 'Verify screener configuration saves when user clicks Save and provides name',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F17: "User dapat save screener"',
      },
      {
        tcId: 'TC-040',
        title: 'Verify saved screener loads with exact same configuration when user selects from list',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F17: "User dapat load screener"',
      },
      {
        tcId: 'TC-041',
        title: 'Verify screener configuration persists after logout and login',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F17: Cross-session persistence',
      },
      {
        tcId: 'TC-042',
        title: 'Verify screener deletes and no longer appears in saved list when user confirms deletion',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F17: "User dapat delete screener"',
      },
      {
        tcId: 'TC-043',
        title: 'Verify rename succeeds when user changes screener name without duplicate',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F17: "User dapat rename screener"',
      },
      {
        tcId: 'TC-044',
        title: 'Verify error occurs when user tries to rename screener to existing name',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F17: Duplicate name validation',
      },
    ],
  })

  // MODULE 15: Real-Time vs Delayed Data
  modules.push({
    moduleNum: 15,
    name: 'Real-Time vs Delayed Data Selection',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-045',
        title: 'Verify real-time data option available to premium users when they access screener',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Security',
        sourceReference: 'F18: "User dapat memilih real-time atau delayed"',
      },
      {
        tcId: 'TC-046',
        title: 'Verify delayed data option shows 15-min delayed prices when free user selects it',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'API / Data Integration',
        sourceReference: 'F18: Delayed data source',
      },
      {
        tcId: 'TC-047',
        title: 'Verify data updates reflect in real-time when premium user has real-time selected',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'API / Data Integration',
        sourceReference: 'F18: Real-time data freshness',
      },
    ],
  })

  // MODULE 16: Alerts Configuration
  modules.push({
    moduleNum: 16,
    name: 'Alert Creation & Management',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-048',
        title: 'Verify alert creates when user sets condition and confirms',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Transaction',
        sourceReference: 'F19: "User dapat men-set alert"',
      },
      {
        tcId: 'TC-049',
        title: 'Verify alert notification triggers when market price crosses alert threshold',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'API / Data Integration',
        sourceReference: 'F19: Alert trigger validation',
      },
      {
        tcId: 'TC-050',
        title: 'Verify error occurs when user tries to set alert without selecting stock',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F19: Alert validation',
      },
    ],
  })

  // MODULE 17: UI States & Error Handling
  modules.push({
    moduleNum: 17,
    name: 'UI States & Error Handling (Empty/Loading/Error)',
    sourceSection: 'Functional Requirements',
    testCases: [
      {
        tcId: 'TC-051',
        title: 'Verify empty state displays when no filters applied and no results available',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F20: "Empty/loading/error state"',
      },
      {
        tcId: 'TC-052',
        title: 'Verify loading spinner displays while screener processes results',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F20: Loading state',
      },
      {
        tcId: 'TC-053',
        title: 'Verify error message displays when data source fails to respond',
        priority: 'P0',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F20: Error state handling',
      },
      {
        tcId: 'TC-054',
        title: 'Verify retry button available when API request fails',
        priority: 'P1',
        behavior: 'Negative',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F20: Error recovery',
      },
    ],
  })

  // MODULE 18: Internationalization (EN/ID)
  modules.push({
    moduleNum: 18,
    name: 'Internationalization Support (EN/ID)',
    sourceSection: 'Non-Functional Requirements',
    testCases: [
      {
        tcId: 'TC-055',
        title: 'Verify all UI labels display in Indonesian when user selects ID language',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F20: "EN/ID support"',
      },
      {
        tcId: 'TC-056',
        title: 'Verify error messages display in selected language when validation fails',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F20: Language consistency',
      },
    ],
  })

  // MODULE 19: Feature Gating & Tier Restrictions
  modules.push({
    moduleNum: 19,
    name: 'Feature Gating (Free/Premium Tiers)',
    sourceSection: 'Acceptance Criteria',
    testCases: [
      {
        tcId: 'TC-057',
        title: 'Verify premium features locked when free tier user tries to access real-time data',
        priority: 'P0',
        behavior: 'Negative',
        testType: 'Security',
        sourceReference: 'F21: "Feature gating based on subscription"',
      },
      {
        tcId: 'TC-058',
        title: 'Verify premium user has full access to all screener features',
        priority: 'P0',
        behavior: 'Positive',
        testType: 'Security',
        sourceReference: 'F21: Premium tier permissions',
      },
      {
        tcId: 'TC-059',
        title: 'Verify upgrade prompt displays when free user reaches feature limit',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Functional · Logic/Flow',
        sourceReference: 'F21: Upgrade flow',
      },
    ],
  })

  // MODULE 20: Audit Logging & Analytics
  modules.push({
    moduleNum: 20,
    name: 'Audit Logging & Analytics Tracking',
    sourceSection: 'Non-Functional Requirements',
    testCases: [
      {
        tcId: 'TC-060',
        title: 'Verify screener run event logged when user executes screening',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Analytics/Tracking',
        sourceReference: 'F21: "Log screener run"',
      },
      {
        tcId: 'TC-061',
        title: 'Verify backtest run event logged with timestamp and user ID',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Analytics/Tracking',
        sourceReference: 'F21: "Log backtest"',
      },
      {
        tcId: 'TC-062',
        title: 'Verify screener save/load events recorded in audit trail',
        priority: 'P1',
        behavior: 'Positive',
        testType: 'Analytics/Tracking',
        sourceReference: 'F21: "Log save/load"',
      },
    ],
  })

  return modules
}

export default getEnhancedTestCases
