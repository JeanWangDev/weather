/** 客户端错误类型（与服务端 WeatherError 分开：不把服务端细节带进 UI 层） */
export class ApiClientError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}
