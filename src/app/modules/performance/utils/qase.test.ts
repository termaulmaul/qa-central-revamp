import { afterEach, expect, test } from 'bun:test';
import {
  clearQaseState,
  createQaseState,
  fetchQaseCases,
  fetchQaseProjects,
  loadQaseState,
  saveQaseState,
} from './qase';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  clearQaseState();
});

test('Qase state stays in memory and resets without credentials', () => {
  const state = createQaseState();
  state.selectedProjectCode = 'DEMO';
  saveQaseState(state);

  expect(loadQaseState().selectedProjectCode).toBe('DEMO');
  expect('token' in loadQaseState()).toBe(false);
  clearQaseState();
  expect(loadQaseState().selectedProjectCode).toBeUndefined();
});

test('fetchQaseProjects uses proxy contract and normalizes entities', async () => {
  let path = '';
  let headers: HeadersInit | undefined;
  globalThis.fetch = Object.assign(async (input: RequestInfo | URL, init?: RequestInit) => {
    path = String(input);
    headers = init?.headers;
    return Response.json({ status: true, result: { total: 1, entities: [{ code: 'DEMO', title: 'Demo' }] } });
  }, { preconnect: () => undefined });

  const projects = await fetchQaseProjects();

  expect(path).toBe('/api/qase/project');
  expect(new Headers(headers).has('X-Qase-Token')).toBe(false);
  expect(projects).toEqual([{ code: 'DEMO', title: 'Demo', counts: undefined }]);
});

test('fetchQaseCases maps suites, steps, and tags defensively', async () => {
  globalThis.fetch = Object.assign(async () => Response.json({
    status: true,
    result: {
      entities: [{
        id: 7,
        title: 'Checkout',
        suite_id: 3,
        steps: [{ action: 'Pay', expected_result: 'Success' }],
        tags: [{ title: 'smoke' }],
      }],
    },
  }), { preconnect: () => undefined });

  const cases = await fetchQaseCases('DEMO', [{ id: 3, title: 'Payments', parentId: null }]);

  expect(cases[0]).toMatchObject({
    id: 7,
    suiteId: 3,
    suiteTitle: 'Payments',
    steps: [{ action: 'Pay', expectedResult: 'Success', data: undefined }],
    tags: ['smoke'],
  });
});
