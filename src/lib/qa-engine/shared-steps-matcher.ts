export interface TestStep {
  order: number;
  action: string;
  expected: string;
  testData?: string;
  sharedStepId?: string;
  requirementId?: string;
  automationHint?: string;
}

export interface SharedStepDefinition {
  id: string;
  hash: string;
  action: string;
  expected: string;
  usageCount: number;
}

// In-memory registry for the current pipeline run
// In a real app, this would be backed by Qase/DB.
export class SharedStepRegistry {
  private steps: Map<string, SharedStepDefinition> = new Map();

  // Normalize step text to ignore minor formatting differences
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\n\r\t]/g, ' ')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Use the normalized string as the hash key directly
  private hashStep(action: string, expected: string): string {
    return `${this.normalize(action)}||${this.normalize(expected)}`;
  }

  // Find an existing shared step or register a new one
  public matchOrRegister(action: string, expected: string): SharedStepDefinition {
    const hash = this.hashStep(action, expected);
    
    if (this.steps.has(hash)) {
      const existing = this.steps.get(hash)!;
      existing.usageCount++;
      return existing;
    }

    const id = `SHR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newSharedStep: SharedStepDefinition = {
      id,
      hash,
      action,
      expected,
      usageCount: 1,
    };
    
    this.steps.set(hash, newSharedStep);
    return newSharedStep;
  }

  public getRegistrySnapshot(): SharedStepDefinition[] {
    return Array.from(this.steps.values());
  }
}

export const globalSharedStepRegistry = new SharedStepRegistry();

// Pre-seed some common shared steps directly from Qase API (Growin Mobile Invest / Customer Area)
globalSharedStepRegistry.matchOrRegister('Input UserID', 'UserID Successfully added');
globalSharedStepRegistry.matchOrRegister('Input Password', 'Password Successfully added');
globalSharedStepRegistry.matchOrRegister('Tap btn Login', 'Btn Clickable');

globalSharedStepRegistry.matchOrRegister('Buka navigasi Stock Screener', 'Halaman Stock Screener terbuka.');
globalSharedStepRegistry.matchOrRegister('Tap Filter', 'Bottomsheet Filter Appeared');
// Removed placeholder steps to eliminate generic titles.
// Use platform-specific shared steps.

// Pre-seeded from OP Scope crawl
globalSharedStepRegistry.matchOrRegister('GROWIN MOBILE-Login & input valid PIN success', 'valid password was entered');
globalSharedStepRegistry.matchOrRegister('GROWIN MOBILE-OMO-Open Banner - Full & Partial Eligible', 'margin banner with button "Apply Now" show');
globalSharedStepRegistry.matchOrRegister('ITS-Success Login', 'Success access its web');

// Pre-seeded from CAR Scope crawl
globalSharedStepRegistry.matchOrRegister('CA - Login User ID - Success', 'The user has successfully logged in');
globalSharedStepRegistry.matchOrRegister('CA - Login Email - Success', 'Btn Clickable');
globalSharedStepRegistry.matchOrRegister('CA - User login using credentials password expired', 'Assertion: Your password has expired');

// Pre-seeded from AT Scope crawl
globalSharedStepRegistry.matchOrRegister('Login API Verified', 'Success Login and get login token');
globalSharedStepRegistry.matchOrRegister('Login PIN API', 'Success login PIN and get login pin token');
globalSharedStepRegistry.matchOrRegister('Login API Unverified', 'Return "is_otp_verified": false');
