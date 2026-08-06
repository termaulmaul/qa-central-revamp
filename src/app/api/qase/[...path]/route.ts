import { NextRequest, NextResponse } from 'next/server';

const QASE_API_BASE = 'https://api.qase.io/v1';

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  // Extract path from params correctly supporting both Next.js 14 and 15
  const resolvedParams = await Promise.resolve(params);
  const pathArray = resolvedParams.path || [];
  const endpoint = `/${pathArray.join('/')}`;
  
  const searchParams = request.nextUrl.search; // includes '?'
  const url = `${QASE_API_BASE}${endpoint}${searchParams}`;

  const token = request.headers.get('Token');
  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing Token header' }, { status: 401 });
  }

  const options: RequestInit = {
    method: request.method,
    headers: {
      'Token': token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    } catch (e) {
      // Ignore body read errors
    }
  }

  try {
    const response = await fetch(url, options);
    
    // Some Qase responses might be empty or non-JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Qase Proxy Error]', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(request, context);
}
