import type { QaseProject, QaseSuite, QaseCase } from '../../types/qase';

interface CacheEntry {
  data: unknown;
  expireAt: number;
}

interface SyncMeta {
  lastSync: string | null;
  etag: string | null;
  updatedAt: string | null;
  revision: number;
}

const CACHE_DIR = '.cache/qase/';

export class QaseLearningCache {
  private store = new Map<string, CacheEntry>();
  private sync = new Map<string, SyncMeta>();

  async get(key: string): Promise<unknown | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expireAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  async set(key: string, data: unknown, ttlMs: number): Promise<void> {
    this.store.set(key, { data, expireAt: Date.now() + ttlMs });
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidatePattern(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  async getSyncMeta(projectCode: string): Promise<SyncMeta> {
    return this.sync.get(projectCode) ?? {
      lastSync: null, etag: null, updatedAt: null, revision: 0,
    };
  }

  async setSyncMeta(projectCode: string, meta: Partial<SyncMeta>): Promise<void> {
    const current = await this.getSyncMeta(projectCode);
    this.sync.set(projectCode, { ...current, ...meta, revision: (current.revision ?? 0) + 1 });
  }

  needsFullSync(projectCode: string): boolean {
    const meta = this.sync.get(projectCode);
    return !meta || !meta.lastSync;
  }

  async getProjects(): Promise<QaseProject[]> {
    return (await this.get('projects') ?? []) as QaseProject[];
  }
  async setProjects(p: QaseProject[]): Promise<void> {
    return this.set('projects', p, 3600000);
  }

  async getSuites(projectCode: string): Promise<QaseSuite[]> {
    return (await this.get(`suites-${projectCode}`) ?? []) as QaseSuite[];
  }
  async setSuites(projectCode: string, s: QaseSuite[]): Promise<void> {
    return this.set(`suites-${projectCode}`, s, 3600000);
  }

  async getCases(projectCode: string): Promise<QaseCase[]> {
    return (await this.get(`cases-${projectCode}`) ?? []) as QaseCase[];
  }
  async setCases(projectCode: string, c: QaseCase[]): Promise<void> {
    return this.set(`cases-${projectCode}`, c, 600000);
  }

  async updateLearningMetrics(): Promise<void> {
    // ponytail: placeholder for metrics collection, extend when analytics dashboard built
  }

  async persist(): Promise<void> {
    if (typeof process === 'undefined' || !process?.versions?.node) return;
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.resolve(CACHE_DIR);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = {
      store: Object.fromEntries(this.store),
      sync: Object.fromEntries(this.sync),
    };
    fs.writeFileSync(path.join(dir, 'qase-cache.json'), JSON.stringify(data, null, 2));
  }

  async restore(): Promise<void> {
    if (typeof process === 'undefined' || !process?.versions?.node) return;
    const fs = await import('fs');
    const path = await import('path');
    const file = path.resolve(CACHE_DIR, 'qase-cache.json');
    if (!fs.existsSync(file)) return;
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      for (const [k, v] of Object.entries(data.store ?? {})) {
        const entry = v as CacheEntry;
        if (entry.expireAt > Date.now()) this.store.set(k, entry);
      }
      for (const [k, v] of Object.entries(data.sync ?? {})) {
        this.sync.set(k, v as SyncMeta);
      }
    } catch { /* corrupt cache, skip */ }
  }
}