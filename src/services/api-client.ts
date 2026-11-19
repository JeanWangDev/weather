import { API_ENDPOINTS } from '@/config/api';
import { REQUEST_TIMEOUT_MS } from '@/config/env';
import { ApiClientError } from './api-client-error';
import { isApiEnvelope, resolveApiMessage, unwrapApiData } from './api-envelope';

/**
 * HTTP 客户端（对齐 Velora-web 的 services/api-client 范式：类 + sendRequest）。
 *
 * 与 Velora 的差异：用原生 fetch 而不是 axios —— 本项目只有两个 GET 接口，
 * 引入 axios 只会多一份依赖与 interceptor 心智负担。
 * 但对外契约保持一致：sendRequest 只返回 data，失败一律抛 ApiClientError。
 */

export interface IRequestConfig {
  url: string;
  method?: 'GET' | 'POST';
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildUrl(url: string, params?: IRequestConfig['params']): string {
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

class ApiClient {
  constructor(private readonly timeoutMs: number = REQUEST_TIMEOUT_MS) {}

  async sendRequest<T>(config: IRequestConfig): Promise<T> {
    const { url, method = 'GET', params, signal, timeoutMs } = config;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? this.timeoutMs);
    const onAbort = () => controller.abort();

    signal?.addEventListener('abort', onAbort, { once: true });

    let response: Response;
    try {
      response = await fetch(buildUrl(url, params), {
        method,
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      // 调用方主动取消：原样抛出，由上层静默丢弃
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiClientError(0, '网络连接失败，请检查网络后重试', error);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok && !isApiEnvelope(payload)) {
      throw new ApiClientError(response.status, '服务暂时不可用，请稍后重试');
    }

    if (isApiEnvelope(payload) && payload.success === false) {
      throw new ApiClientError(
        payload.code ?? response.status,
        resolveApiMessage(payload),
        payload.details,
      );
    }

    if (!response.ok) {
      throw new ApiClientError(response.status, resolveApiMessage(payload as never));
    }

    return unwrapApiData<T>(payload, response.status);
  }
}

export const apiClient = new ApiClient();

export { API_ENDPOINTS };
