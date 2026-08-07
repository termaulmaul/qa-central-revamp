export interface QaseCaseRaw {
  id: number;
  title: string;
  description?: string;
  preconditions?: string;
  postconditions?: string;
  severity?: string;
  priority?: string;
  type?: string;
  behavior?: string;
  automation?: string;
  status?: string;
  is_flaky?: number;
  author_id?: number;
  created_at?: string;
  updated_at?: string;
  suite_id?: number;
  tags?: Array<{ id: number; title: string }>;
  steps?: Array<{
    id?: number;
    action?: string;
    expected_result?: string;
    data?: string;
    position?: number;
  }>;
}

interface QaseAPIResponse {
  status?: boolean;
  result?: {
    total?: number;
    entities?: QaseCaseRaw[];
  };
  total?: number;
  filtered?: number;
  count?: number;
  entities?: QaseCaseRaw[];
}

const QASE_BASE = 'https://api.qase.io/v1';

export class QaseCasesAPI {
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

  async getByProject(projectCode: string, suiteId?: string): Promise<QaseCaseRaw[]> {
    let path = `/case/${encodeURIComponent(projectCode)}?limit=100&offset=0`;
    if (suiteId) path += `&suite_id=${suiteId}`;
    const data = await this.request(path);
    // Qase v1 returns entities nested under result
    const entities = data?.result?.entities ?? data?.entities ?? [];
    return entities.map((e) => ({
      ...e,
      tags: e.tags ?? [],
      steps: e.steps ?? [],
    }));
  }

  async getById(projectCode: string, caseId: number): Promise<QaseCaseRaw | null> {
    const data = await this.request(`/case/${encodeURIComponent(projectCode)}/${caseId}`);
    const entities = data?.result?.entities ?? data?.entities ?? [];
    const found = entities.find((e) => e.id === caseId);
    return found ? { ...found, tags: found.tags ?? [], steps: found.steps ?? [] } : null;
  }
}