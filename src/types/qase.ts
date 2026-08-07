export type QaseStatus = 'idle' | 'testing' | 'connected' | 'syncing' | 'error';

import type { QaseProject, QaseSuite } from '../lib/qase-api';
export type { QaseProject, QaseSuite };

export type QaseCaseStep = {
  action?: string;
  expectedResult?: string;
  data?: string;
};

export type QaseCase = {
  id: number | string;
  title: string;
  suiteId?: number | string;
  suiteTitle?: string;
  severity?: string;
  priority?: string;
  type?: string;
  behavior?: string;
  automationStatus?: string;
  status?: string;
  preconditions?: string;
  postconditions?: string;
  steps: QaseCaseStep[];
  tags: string[];
  updatedAt?: string;
};

export type QaseCapability = {
  resource: string;
  endpoint: string;
  status: 'ok' | 'failed' | 'unchecked';
  count?: number;
  checkedAt?: string;
  optional?: boolean;
  error?: string;
};

export type QaseState = {
  baseUrl?: string;
  token?: string;
  selectedProjectCode?: string;
  selectedCaseId: number | string | null;
  projects: QaseProject[];
  suites: QaseSuite[];
  cases: QaseCase[];
  capabilities: QaseCapability[];
  status: QaseStatus;
  error?: string;
  lastSyncAt?: string;
};
