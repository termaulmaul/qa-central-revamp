import { NextResponse } from 'next/server';

const normalizeUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Base URL is required');
  const raw = value.trim().replace(/\/+$/, '');
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Base URL must use HTTP or HTTPS');
  return url.toString().replace(/\/+$/, '');
};

export async function POST(request: Request) {
  try {
    const { baseUrl, apiToken, ...payload } = await request.json();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (typeof apiToken === 'string' && apiToken) headers.Authorization = `Bearer ${apiToken}`;
    const response = await fetch(`${normalizeUrl(baseUrl)}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? { error: `HTTP ${response.status}` }, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'LLM request failed' }, { status: 400 });
  }
}
