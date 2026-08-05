import type { TestCase } from './qa-engine';
import type { TestStep } from './shared-steps-matcher';

export interface QualityScore {
  total: number;
  breakdown: {
    duplicate: number; // 0-20
    coverage: number; // 0-20
    stepCompleteness: number; // 0-20
    expectedResult: number; // 0-20
    naming: number; // 0-10
    traceability: number; // 0-10
  };
  passed: boolean; // >= 80
  feedback: string[];
}

export function evaluateTestCaseQuality(tc: TestCase): QualityScore {
  const breakdown = {
    duplicate: 20, // Default to no duplicate for now (until connected to Qase API)
    coverage: 20, // Assumed covered if generated via feature parser
    stepCompleteness: 0,
    expectedResult: 0,
    naming: 0,
    traceability: 0,
  };
  const feedback: string[] = [];

  // 1. Step Completeness (0-20)
  if (tc.steps.length >= 4) {
    breakdown.stepCompleteness = 20;
  } else if (tc.steps.length >= 2) {
    breakdown.stepCompleteness = 10;
    feedback.push('Steps could be more comprehensive. Include Navigation, Action, Validation, and Cleanup.');
  } else {
    feedback.push('Too few steps. Minimum 4 steps recommended.');
  }

  // 2. Expected Result Quality (0-20)
  let validExpected = 0;
  for (const step of tc.steps) {
    const expected = step.expected || step.expectedResult;
    if (expected && expected.length > 10 && !expected.toLowerCase().includes('verify application')) {
      validExpected++;
    }
  }
  const expectedRatio = tc.steps.length > 0 ? validExpected / tc.steps.length : 0;
  breakdown.expectedResult = Math.round(expectedRatio * 20);
  if (expectedRatio < 1) {
    feedback.push('Some expected results are missing or too generic (e.g. "Verify application").');
  }

  // 3. Naming Standard (0-10)
  if (tc.title.startsWith('Verify') && tc.title.includes(' when ')) {
    breakdown.naming = 10;
  } else {
    feedback.push('Title must follow "Verify [Behavior] when [Condition]" format.');
  }

  // 4. Traceability (0-10)
  if (tc.requirementId || tc.tags.some(t => t.toLowerCase().includes('fr-') || t.toLowerCase().includes('module'))) {
    breakdown.traceability = 10;
  } else {
    feedback.push('Missing traceability. Link to a requirement ID or Module.');
  }

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const passed = total >= 80;

  return { total, breakdown, passed, feedback };
}

// Expand a simple action into a full workflow
export function expandActionToWorkflow(actionDomain: string, moduleNum: number): Array<TestStep & { expectedResult: string; source: string }> {
  const steps: Array<TestStep & { expectedResult: string; source: string }> = [];
  let order = 1;
  const source = `Module ${moduleNum}`;

  const pushStep = (action: string, expectedResult: string) => {
    steps.push({ order: order++, action, expectedResult, expected: expectedResult, source });
  }

  const domain = actionDomain.toLowerCase();

  // Navigation step with specific outcome
  pushStep(`Navigate to ${actionDomain} module.`, `${actionDomain} interface loads with all controls visible and responsive.`);

  if (domain.includes('buy') || domain.includes('order') || domain.includes('transaction')) {
    pushStep('Search and select target item (e.g., Stock Symbol).', 'Item details load with current price, market status, and lot size displayed.');
    pushStep('Verify current price and market status.', 'Market data is valid, active, and within trading hours.');
    pushStep('Input transaction quantity and price.', 'Form validates inputs: quantity is positive integer, price is within tick size and price ceiling/floor.');
    pushStep('Click submit/buy button.', 'Confirmation dialog appears with order summary (symbol, quantity, price, estimated value).');
    pushStep('Confirm the transaction.', 'Order is submitted to the backend and order reference ID is returned.');
    pushStep('Verify order status in Order Book or Portfolio.', 'Order appears with correct status (e.g., Match/Open) and correct details (symbol, qty, price).');
  } else if (domain.includes('sell')) {
    pushStep('Search and select holding to sell.', 'Holding details load with available quantity, average cost, and current market price.');
    pushStep('Input sell quantity and price.', 'Form validates: quantity does not exceed available holding, price within tick size and ceiling/floor.');
    pushStep('Click submit/sell button.', 'Confirmation dialog shows estimated proceeds and fees.')
    pushStep('Confirm the transaction.', 'Sell order is submitted and order reference ID is returned.')
    pushStep('Verify order status and updated portfolio.', 'Order appears in Order Book with correct side (Sell); portfolio reflects updated holdings after match.')
  } else if (domain.includes('screener') || domain.includes('filter')) {
    pushStep(`Open ${actionDomain} interface.`, `${actionDomain} interface loads with default filters, data table, and filter builder visible.`)
    pushStep('Apply filter criteria (e.g., Sector=Finance, Market Cap 1T-5T).', 'Filter badge shows active criteria; data table refreshes with matching results only.')
    pushStep('Verify filtered results match criteria.', 'All displayed rows match applied filter criteria; row count matches expected filtered set.')
    pushStep('Save filter configuration as preset.', 'Preset is saved with unique name; appears in "My Presets" list and persists across sessions.')
  } else if (domain.includes('backtest')) {
    pushStep('Open Backtest configuration panel.', 'Backtest panel displays basket editor, strategy builder, period selector, and capital input.')
    pushStep('Build basket and strategy.', 'Basket accepts additions/removals; strategy accepts up to 3 conditions; all inputs validate correctly.')
    pushStep('Run backtest with selected period and capital.', 'Backtest engine executes without errors; equity curve renders with strategy vs buy-and-hold comparison.')
    pushStep('Verify backtest statistics.', 'Statistics displayed: Total Return, Buy & Hold, Final Equity, # Trades, Win Rate, Profit Factor, Max Drawdown, Avg Trade.')
    pushStep('Verify per-stock transaction details.', 'Drill-down shows entry/exit dates, prices, return, and contribution for each stock in basket.')
  } else if (domain.includes('export')) {
    pushStep('Open result table with data.', 'Table displays data rows with all configured columns visible.')
    pushStep('Click Export as CSV.', 'Browser initiates CSV download; file name includes timestamp and feature name.')
    pushStep('Verify downloaded CSV content.', 'CSV contains all visible columns and rows; data matches table values exactly; encoding is UTF-8.')
  } else if (domain.includes('portfolio') || domain.includes('holdings')) {
    pushStep('Open Portfolio module.', 'Portfolio loads with total asset value, cash balance, and holdings list with current market values.')
    pushStep('Verify holding details.', 'Each holding shows: symbol, quantity, avg cost, market price, market value, unrealized P&L, % change.')
    pushStep('Refresh portfolio data.', 'Market values update; unrealized P&L recalculates; timestamp updates.')
  } else if (domain.includes('export') || domain.includes('download')) {
    pushStep('Open result table with data.', 'Table displays data rows with all configured columns visible.')
    pushStep('Click Export as CSV.', 'Browser initiates CSV download; file name includes timestamp and feature name.')
    pushStep('Verify downloaded CSV content.', 'CSV contains all visible columns and rows; data matches table values exactly; encoding is UTF-8.')
  } else if (domain.includes('portfolio') || domain.includes('holdings')) {
    pushStep('Open Portfolio module.', 'Portfolio loads with total asset value, cash balance, and holdings list with current market values.')
    pushStep('Verify holding details.', 'Each holding shows: symbol, quantity, avg cost, market price, market value, unrealized P&L, % change.')
    pushStep('Refresh portfolio data.', 'Market values update; unrealized P&L recalculates; timestamp updates.')
  } else if (domain.includes('export') || domain.includes('download')) {
    pushStep('Open result table with data.', 'Table displays data rows with all configured columns visible.')
    pushStep('Click Export as CSV.', 'Browser initiates CSV download; file name includes timestamp and feature name.')
    pushStep('Verify downloaded CSV content.', 'CSV contains all visible columns and rows; data matches table values exactly; encoding is UTF-8.')
  } else {
    pushStep(`Open ${actionDomain} interface.`, `${actionDomain} interface loads with all controls visible and functional.`)
    pushStep(`Perform primary action for ${actionDomain}.`, `Action completes successfully; system state updates accordingly.`)
    pushStep(`Verify ${actionDomain} result.`, `Observable outcome confirms action executed correctly: state changed, data persisted, UI updated.`)
  }

  return steps;
}

export function validateStepAction(action: string): boolean {
  // Reject steps that are too generic
  const invalidPatterns = [
    /^verify application$/i,
    /^test feature$/i,
    /^check system$/i,
    /^click button$/i
  ];
  
  if (action.length < 10) return false; // Too short
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(action.trim())) return false;
  }
  
  return true;
}

export function deduceSuiteRecommendation(requirementName: string): { suite: string; subSuite: string; section?: string } {
  const req = requirementName.toLowerCase();
  
  if (req.includes('buy') || req.includes('sell') || req.includes('order')) {
    return { suite: 'Trading', subSuite: 'Regular Market', section: req.includes('buy') ? 'Buy Order' : 'Sell Order' };
  }
  
  if (req.includes('screener') || req.includes('filter')) {
    return { suite: 'Screener', subSuite: 'Market Screening' };
  }
  
  if (req.includes('backtest')) {
    return { suite: 'Quantitative', subSuite: 'Backtesting' };
  }
  
  if (req.includes('portfolio') || req.includes('holdings')) {
    return { suite: 'Portfolio', subSuite: 'Holdings Management' };
  }
  
  if (req.includes('login') || req.includes('auth')) {
    return { suite: 'Authentication', subSuite: 'User Login' };
  }

  // Fallback
  return { suite: `Feature: ${requirementName}`, subSuite: 'General' };
}
