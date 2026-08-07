import type {
  QaseCapability,
  QaseCase,
  QaseCaseStep,
  QaseProject,
  QaseStatus,
  QaseSuite,
} from '@/types/qase';

type JsonObject = Record<string, unknown>;

const statusForHttp = (status: number): QaseStatus => status === 401 ? 'error' : status === 429 ? 'error' : 'error';

const errorMessage = (data: unknown, fallback: string) => {
  if (!data || typeof data !== 'object') return fallback;
  const value = data as JsonObject;
  return typeof value.error === 'string' ? value.error : typeof value.message === 'string' ? value.message : fallback;
};

import { loadQaseState } from './qase-store';

const request = async (path: string): Promise<unknown> => {
  let response: Response;
  try {
    const { token } = loadQaseState();
    response = await fetch(`/api/qase${path}`, {
      headers: {
        ...(token ? { 'Token': token } : {}),
      }
    });
  } catch {
    throw Object.assign(new Error('Proxy unreachable'), { status: 'error' as QaseStatus });
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = `Qase API failed (${response.status})`;
    throw Object.assign(new Error(errorMessage(data, fallback)), { status: statusForHttp(response.status) });
  }
  if ((data as { status?: unknown } | null)?.status === false) {
    throw Object.assign(new Error(errorMessage(data, 'Qase API failed')), { status: 'error' as QaseStatus });
  }
  return data;
};

const entities = (data: unknown): JsonObject[] => {
  if (!data || typeof data !== 'object') return [];
  const root = data as { result?: unknown; entities?: unknown };
  const list = Array.isArray(root.result)
    ? root.result
    : root.result && typeof root.result === 'object'
      ? (root.result as { entities?: unknown }).entities
      : root.entities;
  return Array.isArray(list)
    ? list.filter((item): item is JsonObject => Boolean(item && typeof item === 'object'))
    : [];
};

const text = (value: unknown) => typeof value === 'string' ? value : undefined;
const title = (value: unknown) => text((value as { title?: unknown } | null)?.title ?? value);
const id = (value: unknown): string | number | undefined => typeof value === 'number' || typeof value === 'string' ? value : undefined;

export const fetchQaseProjects = async (): Promise<QaseProject[]> =>
  entities(await request('/project?limit=100')).flatMap((item) => {
    const code = text(item.code);
    if (!code) return [];
    return [{
      code,
      title: text(item.title) ?? code,
      counts: item.counts && typeof item.counts === 'object' ? item.counts as Record<string, number> : undefined,
    }];
  });

export const testQaseConnection = fetchQaseProjects;

export const fetchQaseSuites = async (projectCode: string): Promise<QaseSuite[]> => {
  if (!projectCode) throw new Error('Project not selected');
  return entities(await request(`/suite/${encodeURIComponent(projectCode)}?limit=100`)).flatMap((item) => {
    const suiteId = id(item.id);
    if (suiteId === undefined) return [];
    return [{
      id: suiteId,
      title: text(item.title) ?? `Suite ${suiteId}`,
      parentId: id(item.parent_id) ?? null,
      casesCount: typeof item.cases_count === 'number' ? item.cases_count : undefined,
    }];
  });
};

export const fetchQaseCases = async (projectCode: string, suites: QaseSuite[] = []): Promise<QaseCase[]> => {
  if (!projectCode) throw new Error('Project not selected');
  const suiteMap = new Map(suites.map((suite) => [String(suite.id), suite.title]));

  return entities(await request(`/case/${encodeURIComponent(projectCode)}?limit=100`)).flatMap((item) => {
    const caseId = id(item.id);
    if (caseId === undefined) return [];
    const suiteId = id(item.suite_id);
    const steps: QaseCaseStep[] = Array.isArray(item.steps) ? item.steps.map((step) => {
      const value = step as JsonObject;
      return { action: text(value.action), expectedResult: text(value.expected_result), data: text(value.data) };
    }) : [];
    const tags = Array.isArray(item.tags)
      ? item.tags.map((tag) => title(tag)).filter((tag): tag is string => Boolean(tag))
      : [];

    return [{
      id: caseId,
      title: text(item.title) ?? `Case ${caseId}`,
      suiteId,
      suiteTitle: suiteId === undefined ? undefined : suiteMap.get(String(suiteId)),
      severity: title(item.severity),
      priority: title(item.priority),
      type: title(item.type),
      behavior: title(item.behavior),
      automationStatus: title(item.automation_status ?? item.automation),
      status: title(item.status),
      preconditions: text(item.preconditions),
      postconditions: text(item.postconditions),
      steps,
      tags,
      updatedAt: text(item.updated_at),
    }];
  });
};

const resourceCount = async (resource: 'run' | 'defect', projectCode: string) =>
  entities(await request(`/${resource}/${encodeURIComponent(projectCode)}?limit=100`)).length;

export const fetchQaseResourceCount = (resource: 'runs' | 'defects', projectCode: string) =>
  resourceCount(resource === 'runs' ? 'run' : 'defect', projectCode);

export const probeQaseCapabilities = async (projectCode?: string): Promise<QaseCapability[]> => {
  const checkedAt = new Date().toISOString();
  const definitions = [
    { resource: 'Projects', endpoint: '/project', run: () => fetchQaseProjects() },
    { resource: 'Suites', endpoint: '/suite/{projectCode}', run: () => projectCode ? fetchQaseSuites(projectCode) : Promise.reject(new Error('Project not selected')) },
    { resource: 'Cases', endpoint: '/case/{projectCode}', run: () => projectCode ? fetchQaseCases(projectCode) : Promise.reject(new Error('Project not selected')) },
    { resource: 'Runs', endpoint: '/run/{projectCode}', optional: true, run: () => projectCode ? resourceCount('run', projectCode).then((count) => Array(count)) : Promise.reject(new Error('Project not selected')) },
    { resource: 'Defects', endpoint: '/defect/{projectCode}', optional: true, run: () => projectCode ? resourceCount('defect', projectCode).then((count) => Array(count)) : Promise.reject(new Error('Project not selected')) },
  ];

  return Promise.all(definitions.map(async ({ resource, endpoint, optional, run }) => {
    if (!projectCode && resource !== 'Projects') return { resource, endpoint, status: 'unchecked', optional } as QaseCapability;
    try {
      const values = await run();
      return { resource, endpoint, status: 'ok', count: values.length, checkedAt, optional } as QaseCapability;
    } catch (error) {
      return {
        resource,
        endpoint,
        status: 'failed',
        checkedAt,
        optional,
        error: error instanceof Error ? error.message : 'Qase API failed',
      } as QaseCapability;
    }
  }));
};
