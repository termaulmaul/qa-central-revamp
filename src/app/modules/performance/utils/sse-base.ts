// In dev mode Vite (5173) proxies to Bun (3010), but Vite's http-proxy
// can buffer SSE streams causing events to never arrive on LAN devices.
// Bypass the proxy by connecting directly to Bun's port — it already
// listens on 0.0.0.0 so the same hostname works from any LAN device.
const BUN_PORT = '3010';

export function sseUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:${BUN_PORT}${path}`;
  }
  return path; // production: Bun serves everything on same origin
}
