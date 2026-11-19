import { ApiClientError } from './api-client-error';

/** 统一响应信封：{ code, success, message, timestamp, data } */
interface IApiResponse<T = unknown> {
  code?: number;
  message?: string;
  msg?: string;
  data: T | null;
  success?: boolean;
  timestamp?: number;
  details?: unknown;
}

export function resolveApiMessage(payload?: Partial<IApiResponse>): string {
  return payload?.message ?? payload?.msg ?? '请求失败';
}

export function isApiEnvelope<T>(payload: unknown): payload is IApiResponse<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    ('success' in payload || 'code' in payload || 'message' in payload)
  );
}

/**
 * 拆信封：成功返回 data，失败抛 ApiClientError。
 * 与 Velora-web 的 unwrapApiData 一致，差别只在于使用真实 HTTP 状态码兜底。
 */
export function unwrapApiData<T>(payload: unknown, status = 500): T {
  if (!isApiEnvelope<T>(payload)) {
    return payload as T;
  }

  if (payload.success === false) {
    throw new ApiClientError(payload.code ?? status, resolveApiMessage(payload), payload.details);
  }

  if (typeof payload.code === 'number' && payload.code !== 200) {
    throw new ApiClientError(payload.code, resolveApiMessage(payload), payload.details);
  }

  return payload.data as T;
}
