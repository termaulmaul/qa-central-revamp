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
    const body = await request.json();
    const baseUrl = normalizeUrl(body.baseUrl);
    const headers: HeadersInit = {};
    if (typeof body.apiToken === 'string' && body.apiToken) headers.Authorization = `Bearer ${body.apiToken}`;
    const response = await fetch(`${baseUrl}/models`, { headers, cache: 'no-store' });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? { error: `HTTP ${response.status}` }, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch models' }, { status: 400 });
  }
}
