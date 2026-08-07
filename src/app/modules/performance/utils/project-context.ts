export const PROJECT_CONTEXT_KEY = 'pt.project_id';
export const PROJECT_CONTEXT_EVENT = 'pt:project-context-change';

export function getProjectId(): string | null {
  try {
    return localStorage.getItem(PROJECT_CONTEXT_KEY);
  } catch {
    return null;
  }
}

export function setProjectId(projectId: string | null): void {
  try {
    if (projectId) localStorage.setItem(PROJECT_CONTEXT_KEY, projectId);
    else localStorage.removeItem(PROJECT_CONTEXT_KEY);
  } catch {
    // Storage may be unavailable; the event still updates in-memory consumers.
  }
  window.dispatchEvent(new CustomEvent(PROJECT_CONTEXT_EVENT, { detail: { projectId } }));
}
