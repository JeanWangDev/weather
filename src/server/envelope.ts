import { NextResponse } from 'next/server';

/** 统一响应信封：与服务端 routes、客户端 api-envelope 完全同构 */
export function ok<T>(data: T, init?: { headers?: Record<string, string>; status?: number }) {
  return NextResponse.json(
    { code: init?.status ?? 200, success: true, message: 'ok', timestamp: Date.now(), data },
    { status: init?.status ?? 200, headers: init?.headers },
  );
}

export function fail(message: string, status = 500) {
  return NextResponse.json(
    { code: status, success: false, message, timestamp: Date.now(), data: null },
    { status },
  );
}
