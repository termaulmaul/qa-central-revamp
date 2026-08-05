import { globalSharedStepRegistry } from './shared-steps-matcher';
import type { TestStep } from './shared-steps-matcher';
import { t } from './locales';

// Generate specific, human-executable steps for a given test case scenario
export function generateExecutableSteps(
  moduleNum: number,
  moduleName: string,
  testCaseTitle: string,
  behavior: string,
  platform?: string
): Array<TestStep & { expectedResult: string; source: string }> {
  const steps: Array<TestStep & { expectedResult: string; source: string }> = [];
  let order = 1;

  const pushStepWithData = (action: string, expected: string, testData: string, source: string) => {
    // Attempt to match or register as a shared step
    const shared = globalSharedStepRegistry.matchOrRegister(action, expected);
    steps.push({
      order: order++,
      action,
      expected,
      expectedResult: expected, // Backwards compatibility for UI
      testData,
      source,
      sharedStepId: shared.usageCount > 1 ? shared.id : undefined,
    });
  };

  const pushStep = (action: string, expected: string, source: string) => {
    pushStepWithData(action, expected, '', source);
  };

  // 1. Authentication / Entry (Shared Step candidate)
  const isGuest = testCaseTitle.toLowerCase().includes('without login') || testCaseTitle.toLowerCase().includes('unauthenticated') || moduleName.toLowerCase().includes('without login') || moduleName.toLowerCase().includes('unauthenticated');
  if (isGuest) {
    pushStep(t('guestAccess'), t('guestAccessExpected'), `Module ${moduleNum}`);
  } else {
    const isPremium = testCaseTitle.toLowerCase().includes('premium');
    const userRole = isPremium ? '(User QA Premium)' : '(User QA)';
    const plat = (platform || 'Web Pro').toLowerCase();

    if (plat.includes('web pro') || plat.includes('gp')) {
      pushStep(t('openLoginWebPro'), t('loginPageDisplayed'), `Module ${moduleNum}`);
      pushStepWithData(t('inputUserId'), t('userIdSuccess'), userRole, `Module ${moduleNum}`);
      pushStepWithData(t('inputPassword'), t('passwordSuccess'), 'M@nsek.123', `Module ${moduleNum}`);
      pushStep(t('clickLogin'), t('loginPinFormDisplayed'), `Module ${moduleNum}`);
      pushStep(t('inputPin'), t('inputPinSuccessToPro'), `Module ${moduleNum}`);
    } else if (plat.includes('web invest') || plat.includes('gi')) {
      pushStep(t('openLoginWebInvest'), t('loginPageDisplayed'), `Module ${moduleNum}`);
      pushStepWithData(t('inputUserIdOrEmail'), t('userIdOrEmailSuccess'), userRole, `Module ${moduleNum}`);
      pushStepWithData(t('inputPassword'), t('passwordSuccess'), 'M@nsek.123', `Module ${moduleNum}`);
      pushStep(t('clickLogin'), t('loginDirectToInvestHome'), `Module ${moduleNum}`);
    } else if (plat.includes('its')) {
      pushStep(t('openLoginIts'), t('itsWebAccessSuccess'), `Module ${moduleNum}`);
      pushStepWithData(t('inputUserIdLower'), t('userIdSuccessLower'), userRole, `Module ${moduleNum}`);
      pushStepWithData(t('inputPasswordLower'), t('passwordSuccessLower'), 'M@nsek.123', `Module ${moduleNum}`);
      pushStep(t('clickLogin'), t('loginDirectToPin'), `Module ${moduleNum}`);
      pushStep(t('inputPinLower'), t('inputPinSuccess'), `Module ${moduleNum}`);
      pushStep(t('clickSubmit'), t('submitPinSuccessIts'), `Module ${moduleNum}`);
    } else if (plat.includes('invest') || plat.includes('mi')) {
      pushStep(t('openAppMobileInvest'), t('loginPageDisplayed'), `Module ${moduleNum}`);
      pushStepWithData(t('inputUserIdOrEmail'), t('userIdOrEmailSuccess'), userRole, `Module ${moduleNum}`);
      pushStepWithData(t('inputPassword'), t('passwordSuccess'), 'M@nsek.123', `Module ${moduleNum}`);
      pushStep(t('tapLogin'), t('loginDirectToHome'), `Module ${moduleNum}`);
    } else {
      // Default to Mobile Pro / general mobile
      pushStep(t('openAppGrowin'), t('appOpened'), `Module ${moduleNum}`);
      pushStepWithData(t('inputUserIdLower'), t('userIdSuccessLower'), userRole, `Module ${moduleNum}`);
      pushStepWithData(t('inputPasswordLower'), t('passwordSuccessLower'), 'M@nsek.123', `Module ${moduleNum}`);
      pushStep(t('clickLoginLower'), t('loginSuccessHomeOpen'), `Module ${moduleNum}`);
      pushStep(t('clickEyeIcon'), t('pinFormShow'), `Module ${moduleNum}`);
      pushStep(t('inputPinLower'), t('restrictedInfoShow'), `Module ${moduleNum}`);
    }
  }

  // 2. Navigation (Shared Step candidate)
  pushStep(t('selectMenuPattern', moduleName), t('pageRenderPattern', moduleName), `Module ${moduleNum}`);

  // 3. Contextual Data Preparation / Execution
  const lowerTitle = testCaseTitle.toLowerCase();
  
  if (lowerTitle.includes('filter') || lowerTitle.includes('screener')) {
    pushStep(t('tapFilter'), t('filterAppeared'), `Module ${moduleNum}`);
    pushStep(t('inputFilter'), t('filterApplied'), `Module ${moduleNum}`);
    pushStep(t('confirmFilter'), t('filterSuccess'), `Module ${moduleNum}`);
  } 
  else if (lowerTitle.includes('backtest')) {
    pushStep(t('addStockToBasket'), t('stockAdded'), `Module ${moduleNum}`);
    pushStep(t('selectPeriod'), t('periodSet'), `Module ${moduleNum}`);
    pushStep(t('runBacktest'), t('backtestRunning'), `Module ${moduleNum}`);
    pushStep(t('verifyChart'), t('chartRendered'), `Module ${moduleNum}`);
  }
  else if (lowerTitle.includes('save preset') || lowerTitle.includes('save screener')) {
    pushStep(t('setFilterParams'), t('paramsSet'), `Module ${moduleNum}`);
    pushStep(t('savePreset'), t('presetSaved'), `Module ${moduleNum}`);
    pushStep(t('openMyPresets'), t('presetAppears'), `Module ${moduleNum}`);
  }
  else if (lowerTitle.includes('export') || lowerTitle.includes('download')) {
    pushStep(t('showDataInTable'), t('tableHasData'), `Module ${moduleNum}`);
    pushStep(t('clickExport'), t('downloadStarted'), `Module ${moduleNum}`);
    pushStep(t('openCsv'), t('csvMatchesTable'), `Module ${moduleNum}`);
  }
  else if (behavior === 'Negative' || lowerTitle.includes('error') || lowerTitle.includes('invalid')) {
    pushStep(t('triggerInvalid'), t('invalidDetected'), `Module ${moduleNum}`);
    pushStep(t('verifyError'), t('errorDisplayed'), `Module ${moduleNum}`);
  }
  else {
    // Generic deterministic execution
    const actionDetail = extractActionDetail(testCaseTitle);
    const formattedAction = actionDetail.charAt(0).toUpperCase() + actionDetail.slice(1);
    
    if (formattedAction.toLowerCase().startsWith('user ')) {
      pushStep(formattedAction, t('actionProcessed'), `Module ${moduleNum}`);
    } else {
      pushStep(t('performActionPattern', formattedAction), t('actionSuccess'), `Module ${moduleNum}`);
    }
    pushStep(t('verifyFinalState'), t('finalStatePattern', formattedAction), `Module ${moduleNum}`);
  }

  return steps;
}

function extractActionDetail(title: string): string {
  const patterns = [
    /\bwhen\s+(.+)$/i,
    /\bif\s+(.+)$/i,
    /\bafter\s+(.+)$/i,
    /\bbefore\s+(.+)$/i,
    /\bonce\s+(.+)$/i,
    /\bwhile\s+(.+)$/i,
    /\bunless\s+(.+)$/i,
    /\buntil\s+(.+)$/i,
    /\bprovided\s+that\s+(.+)$/i,
    /\bin\s+case\s+(.+)$/i,
    /\bduring\s+(.+)$/i,
    /\bupon\s+(.+)$/i,
    /\bwhere\s+(.+)$/i,
    /\bbased\s+on\s+(.+)$/i,
    /\baccording\s+to\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const clean = match[1].trim().replace(/[.,;:]+$/, '');
      if (clean.length > 3 && !clean.toLowerCase().includes('condition')) {
        return clean;
      }
    }
  }

  return 'trigger scenario action';
}
