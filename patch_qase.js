const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/lib/qase-api.ts';
let code = fs.readFileSync(file, 'utf8');

const checkCapabilitiesFn = `  async checkCapabilities(projectCode: string): Promise<{resource: string, endpoint: string, status: 'ok' | 'unchecked' | 'error', count?: number, checkedAt?: string, error?: string, optional?: boolean}[]> {
    const caps = [
      { resource: 'Projects', endpoint: '/project', type: 'list' },
      { resource: 'Suites', endpoint: \`/suite/\${projectCode}\`, type: 'list' },
      { resource: 'Cases', endpoint: \`/case/\${projectCode}\`, type: 'list' },
      { resource: 'Runs', endpoint: \`/run/\${projectCode}\`, type: 'list', optional: true },
      { resource: 'Defects', endpoint: \`/defect/\${projectCode}\`, type: 'list', optional: true },
    ];
    
    const results = [];
    for (const cap of caps) {
      const now = new Date().toISOString();
      try {
        const response = await this.makeRequest<any>('GET', cap.endpoint + '?limit=1');
        const count = extractTotal(response, 0);
        results.push({
          resource: cap.resource,
          endpoint: cap.endpoint.replace(projectCode, '{projectCode}'),
          status: 'ok' as const,
          count,
          checkedAt: now,
          optional: cap.optional
        });
      } catch (err: any) {
        results.push({
          resource: cap.resource,
          endpoint: cap.endpoint.replace(projectCode, '{projectCode}'),
          status: 'error' as const,
          error: err.message || "Failed",
          checkedAt: now,
          optional: cap.optional
        });
      }
    }
    return results;
  }

  async testConnection(): Promise<boolean> {`;

code = code.replace("  async testConnection(): Promise<boolean> {", checkCapabilitiesFn);
fs.writeFileSync(file, code);
console.log("Updated qase-api.ts successfully.");
