export * from './qase-client';
export * from './qase-store';

import type { QaseStatus } from '@/types/qase';

export const qaseStatusLabel: Record<QaseStatus, string> = {
  idle: 'Not configured',
  testing: 'Testing',
  connected: 'Connected',
  syncing: 'Syncing',
  error: 'Error',
};
