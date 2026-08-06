import type { ParsedRequirement } from '../requirements/types';
import type { TestCaseType, TestDataSet } from './types';

export interface EdgeCase {
  type: TestCaseType;
  title: string;
  description: string;
  testData: TestDataSet[];
  priority: 'P0' | 'P1' | 'P2';
}

export class EdgeCaseGenerator {
  static generate(req: ParsedRequirement): EdgeCase[] {
    const cases: EdgeCase[] = [];
    const text = `${req.title} ${req.description} ${req.acceptance_criteria.map(ac => ac.text).join(' ')}`.toLowerCase();

    if (this.hasNumericFields(text)) cases.push(this.boundaryCase(req));
    if (this.hasStringFields(text)) cases.push(this.lengthCase(req));
    if (this.hasDateTime(text)) cases.push(this.dateEdgeCase(req));
    if (this.hasConcurrency(text)) cases.push(this.concurrencyCase(req));
    if (this.hasPermissions(text)) cases.push(this.permissionCase(req));
    if (this.hasNetwork(text)) cases.push(this.networkCase(req));
    if (this.hasTransactions(text)) cases.push(this.transactionCase(req));

    return cases;
  }

  private static hasNumericFields(text: string): boolean {
    return /(amount|price|quantity|count|limit|age|score|rate|percentage|balance)/.test(text);
  }

  private static hasStringFields(text: string): boolean {
    return /(name|email|password|username|address|description|code|id|token)/.test(text);
  }

  private static hasDateTime(text: string): boolean {
    return /(date|time|schedule|deadline|expiry|expire|birthday|created|updated)/.test(text);
  }

  private static hasConcurrency(text: string): boolean {
    return /(concurrent|parallel|simultaneous|multi-user|race|lock|thread)/.test(text);
  }

  private static hasPermissions(text: string): boolean {
    return /(role|permission|admin|user|access|authoriz|authenticat)/.test(text);
  }

  private static hasNetwork(text: string): boolean {
    return /(network|api|http|request|response|timeout|latency|offline|connect)/.test(text);
  }

  private static hasTransactions(text: string): boolean {
    return /(transaction|payment|transfer|order|checkout|billing|wallet|ledger)/.test(text);
  }

  private static boundaryCase(req: ParsedRequirement): EdgeCase {
    return {
      type: 'Boundary',
      title: `Boundary values for ${req.title}`,
      description: 'Test numeric field boundaries (min, max, overflow, underflow, zero, negative)',
      testData: [
        { name: 'Zero', type: 'boundary', values: { value: 0 }, description: 'Zero boundary' },
        { name: 'Negative', type: 'boundary', values: { value: -1 }, description: 'Negative boundary' },
        { name: 'Max Int', type: 'boundary', values: { value: 2147483647 }, description: 'Max 32-bit integer' },
        { name: 'Overflow', type: 'boundary', values: { value: 2147483648 }, description: 'Integer overflow' },
      ],
      priority: 'P1',
    };
  }

  private static lengthCase(req: ParsedRequirement): EdgeCase {
    return {
      type: 'Boundary',
      title: `String length limits for ${req.title}`,
      description: 'Test string field min/max lengths, empty, unicode, special chars',
      testData: [
        { name: 'Empty', type: 'boundary', values: { value: '' }, description: 'Empty string' },
        { name: 'Single char', type: 'boundary', values: { value: 'a' }, description: 'Min length 1' },
        { name: 'Max length', type: 'boundary', values: { value: 'a'.repeat(255) }, description: 'Max length 255' },
        { name: 'Over max', type: 'boundary', values: { value: 'a'.repeat(256) }, description: 'Over max length' },
        { name: 'Unicode', type: 'edge', values: { value: '😀🎉中文العربية' }, description: 'Unicode characters' },
        { name: 'SQL injection', type: 'edge', values: { value: "1' OR '1'='1" }, description: 'SQL injection attempt' },
        { name: 'XSS payload', type: 'edge', values: { value: '<script>alert(1)</script>' }, description: 'XSS payload' },
      ],
      priority: 'P1',
    };
  }

  private static dateEdgeCase(req: ParsedRequirement): EdgeCase {
    return {
      type: 'Boundary',
      title: `Date/time edge cases for ${req.title}`,
      description: 'Test date boundaries, timezones, DST, leap years, invalid formats',
      testData: [
        { name: 'Leap day', type: 'boundary', values: { value: '2024-02-29' }, description: 'Leap year date' },
        { name: 'DST transition', type: 'boundary', values: { value: '2024-03-10T02:00:00' }, description: 'DST spring forward' },
        { name: 'Unix epoch', type: 'boundary', values: { value: '1970-01-01' }, description: 'Unix epoch start' },
        { name: 'Far future', type: 'boundary', values: { value: '2099-12-31' }, description: 'Year 2099' },
        { name: 'Invalid format', type: 'edge', values: { value: 'not-a-date' }, description: 'Invalid date format' },
        { name: 'Timezone offset', type: 'edge', values: { value: '2024-01-01T00:00:00+14:00' }, description: 'Max timezone offset' },
      ],
      priority: 'P2',
    };
  }

  private static concurrencyCase(req: ParsedRequirement): EdgeCase {
    return {
      type: 'Concurrency',
      title: `Concurrency test for ${req.title}`,
      description: 'Test simultaneous access, race conditions, locking behavior',
      testData: [
        { name: 'Double submit', type: 'edge', values: { attempts: 2, delay: 0 }, description: 'Double click submit' },
        { name: 'Parallel requests', type: 'edge', values: { count: 10, delay: 10 }, description: '10 parallel requests' },
        { name: 'Rapid toggle', type: 'edge', values: { count: 50, delay: 5 }, description: 'Rapid state changes' },
      ],
      priority: 'P2',
    };
  }

  private static permissionCase(req: ParsedRequirement): EdgeCase {
    return {
      type: 'Role-Based',
      title: `Permission boundary for ${req.title}`,
      description: 'Test access control boundaries, privilege escalation, role transitions',
      testData: [
        { name: 'Unauthenticated', type: 'edge', values: { role: 'guest' }, description: 'No auth token' },
        { name: 'Wrong role', type: 'edge', values: { role: 'viewer' }, description: 'Insufficient permissions' },
        { name: 'Admin bypass', type: 'edge', values: { role: 'admin', bypass: true }, description: 'Admin privilege test' },
        { name: 'Expired token', type: 'edge', values: { token: 'expired' }, description: 'Expired JWT' },
      ],
      priority: 'P1',
    };
  }

  private static networkCase(req: ParsedRequirement): EdgeCase {
    return {
      type: 'Recovery',
      title: `Network resilience for ${req.title}`,
      description: 'Test offline, timeout, retry, partial failure scenarios',
      testData: [
        { name: 'Timeout', type: 'edge', values: { timeout: 5000 }, description: 'Request timeout' },
        { name: 'Offline', type: 'edge', values: { offline: true }, description: 'Network offline' },
        { name: 'Partial response', type: 'edge', values: { partial: true }, description: 'Incomplete response' },
        { name: 'Rate limited', type: 'edge', values: { rateLimit: true }, description: 'HTTP 429' },
      ],
      priority: 'P2',
    };
  }

  private static transactionCase(req: ParsedRequirement): EdgeCase {
    return {
      type: 'Recovery',
      title: `Transaction integrity for ${req.title}`,
      description: 'Test ACID properties, rollback, idempotency, duplicate prevention',
      testData: [
        { name: 'Duplicate request', type: 'edge', values: { idempotencyKey: 'same' }, description: 'Idempotent retry' },
        { name: 'Partial failure', type: 'edge', values: { failAt: 'commit' }, description: 'Fail during commit' },
        { name: 'Rollback verify', type: 'edge', values: { rolledBack: true }, description: 'Verify rollback state' },
      ],
      priority: 'P0',
    };
  }
}

export const edgeCaseGenerator = new EdgeCaseGenerator();