export interface QaseSuiteRaw {
  id: number;
  title: string;
  description?: string;
  preconditions?: string;
  parent_id?: number | null;
  cases_count?: number;
  is_completed?: boolean;
  depth?: number;
}

interface QaseAPIResponse {
  status?: boolean;
  result?: {
    total?: number;
    entities?: QaseSuiteRaw[];
  };
}

const QASE_BASE = 'https://api.qase.io/v1';

export class QaseSuitesAPI {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl = QASE_BASE) {
    this.token = token;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request(path: string): Promise<QaseAPIResponse> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Token: this.token, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Qase API ${res.status}: ${res.statusText}`);
    return (await res.json()) as QaseAPIResponse;
  }

  async getByProject(projectCode: string): Promise<QaseSuiteRaw[]> {
    const data = await this.request(`/suite/${encodeURIComponent(projectCode)}?limit=100&offset=0`);
    return data?.result?.entities ?? [];
  }

  async getTree(projectCode: string): Promise<QaseSuiteRaw[]> {
    const suites = await this.getByProject(projectCode);
    const map = new Map<number, QaseSuiteRaw>();
    for (const s of suites) map.set(s.id, s);
    // attach depth via parent traversal
    for (const s of suites) {
      let depth = 0;
      let parent = s.parent_id;
      while (parent) {
        depth++;
        const p = map.get(parent);
        if (!p) break;
        parent = p.parent_id ?? null;
      }
      s.depth = depth;
    }
    return suites.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
  }
}