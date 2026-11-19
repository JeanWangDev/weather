/**
 * 服务端统一错误与响应信封。
 * 对应 Velora-api 的 AppError + api-response 中间件，但状态码遵循 HTTP 语义。
 */

export class WeatherError extends Error {
  readonly status: number;

  constructor(message: string, status = 500, options: { cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'WeatherError';
    this.status = status;
  }
}

export function toWeatherError(error: unknown): WeatherError {
  if (error instanceof WeatherError) return error;
  return new WeatherError('服务开小差了，请稍后重试', 500, { cause: error });
}
