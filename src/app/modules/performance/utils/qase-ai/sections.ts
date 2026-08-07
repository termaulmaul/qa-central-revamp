export interface QaseSectionRaw {
  id: number;
  title: string;
  description?: string;
  parent_id?: number | null;
  cases_count?: number;
  depth?: number;
  order?: number;
}

interface QaseAPIResponse {
  status?: boolean;
  result?: {
    total?: number;
    entities?: QaseSectionRaw[];
  };
}

const QASE_BASE = 'https://api.qase.io/v1';

export class QaseSectionsAPI {
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

  async getBySuite(projectCode: string, suiteId: number): Promise<QaseSectionRaw[]> {
    const data = await this.request(`/section/${encodeURIComponent(projectCode)}?suite_id=${suiteId}&limit=100&offset=0`);
    return data?.result?.entities ?? [];
  }

  async getTree(projectCode: string, suiteId: number): Promise<QaseSectionRaw[]> {
    const sections = await this.getBySuite(projectCode, suiteId);
    const map = new Map<number, QaseSectionRaw>();
    for (const s of sections) map.set(s.id, s);
    for (const s of sections) {
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
    return sections.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
  }
}