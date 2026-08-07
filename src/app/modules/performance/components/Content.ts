export interface RepositoryListing {
  name: string;
  scripts: string[];
  platforms?: string[];
  scenarios: Partial<Record<string, string[]>>;
}

export const EXEC_TYPES = ['MANUAL', 'REGRESSION', 'LOADTEST'] as const;

const GATED_ENV_MODES = new Set(['STG', 'PRD', 'PROD']);

export const availableEnvModes = (envModes: string[], stgProd: boolean): string[] => {
  const modes = envModes.length ? envModes : ['INT', 'STG', 'PROD'];
  return modes.filter((mode) => stgProd || !GATED_ENV_MODES.has(mode));
};

export const bpTokensOf = (paths: string[]): string[] => [...new Set(
  paths
    .map((path) => /(?:^|[/_-])(BP\d+)/i.exec(path)?.[1]?.toUpperCase())
    .filter((token): token is string => Boolean(token)),
)];
