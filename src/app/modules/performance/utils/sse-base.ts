// Ported from a Vite+Bun setup where the dev proxy (Vite 5173 -> Bun 3010)
// could buffer SSE streams, so dev builds bypassed it and connected to Bun's
// port directly. This app is single-server Next.js (API routes and pages both
// served from the same origin in dev and prod), so that split never applies
// here — always same-origin. (The old check also used Vite's
// `import.meta.env.DEV`, which is undefined under Next.js/webpack and would
// throw "Cannot read properties of undefined (reading 'DEV')" on every call.)
export function sseUrl(path: string): string {
  return path;
}
