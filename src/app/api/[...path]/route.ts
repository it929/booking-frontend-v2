import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000';

async function forwardRequest(req: NextRequest, targetUrl: string, bodyBuffer?: ArrayBuffer, attempt = 1): Promise<Response> {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set('connection', 'close');

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer,
      cache: 'no-store',
      keepalive: false,
    });
    return res;
  } catch (err: unknown) {
    // If PHP's single-threaded dev server was busy with a concurrent request, retry up to 3 times
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 80 * attempt));
      return forwardRequest(req, targetUrl, bodyBuffer, attempt + 1);
    }
    throw err;
  }
}

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  
  const searchStr = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/${pathStr}${searchStr}`;

  const isGetOrHead = req.method === 'GET' || req.method === 'HEAD';
  const bodyBuffer = isGetOrHead ? undefined : await req.arrayBuffer();

  try {
    const backendRes = await forwardRequest(req, targetUrl, bodyBuffer);
    const data = await backendRes.arrayBuffer();

    const responseHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.set(key, val);
      }
    });
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new NextResponse(data, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown backend proxy error';
    return NextResponse.json(
      { error: 'Backend connection failure', detail: message },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const dynamic = 'force-dynamic';
