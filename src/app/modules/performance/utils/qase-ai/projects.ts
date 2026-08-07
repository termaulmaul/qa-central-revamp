import type { QaseProject } from '../../types/qase';

interface QaseAPIResponse {
  status?: boolean;
  result?: {
    total?: number;
    entities?: Array<Record<string, unknown>>;
  };
}

const QASE_BASE = 'https://api.qase.io/v1';

export class QaseProjectsAPI {
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

  async getAll(): Promise<QaseProject[]> {
    const data = await this.request('/project?limit=100&offset=0');
    const entities = data?.result?.entities ?? [];
    return entities.map((e) => ({
      code: String(e.code ?? ''),
      title: String(e.title ?? e.name ?? ''),
      counts: e.counts as Record<string, number> | undefined,
    })).filter((p) => p.code);
  }

  async getByCode(code: string): Promise<QaseProject | null> {
    const all = await this.getAll();
    return all.find((p) => p.code === code) ?? null;
  }
}