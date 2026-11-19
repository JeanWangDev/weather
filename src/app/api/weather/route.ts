import { fetchWeather } from '@/server/weather/metno';
import { toWeatherError } from '@/server/weather-error';
import { fail, ok } from '@/server/envelope';
import type { GeoLocation } from '@/types/weather';

/**
 * 天气查询代理。
 *
 * 1. 校验入参（经纬度范围、必填字段），把脏参数挡在上游之前；
 * 2. 进程内 10 分钟缓存：与上游更新频率对齐，避免同一城市被重复请求放大。
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<string, { data: unknown; cachedAt: number }>();

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const latitude = Number(params.get('lat'));
  const longitude = Number(params.get('lon'));
  const name = params.get('name');
  const timezone = params.get('timezone') ?? 'UTC';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !name) {
    return fail('缺少或无效的定位参数', 400);
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return fail('经纬度超出有效范围', 400);
  }

  const location: GeoLocation = {
    id: Number(params.get('id')) || 0,
    name,
    country: params.get('country') ?? '',
    admin1: params.get('admin1') ?? undefined,
    latitude,
    longitude,
    timezone,
  };

  const cacheKey = `${latitude.toFixed(2)}|${longitude.toFixed(2)}|${timezone}`;
  const cached = cache.get(cacheKey);

  /**
   * 缓存只保存「天气数据」，地点身份（name/admin1/country）每次按当前请求重建。
   * 否则同一坐标先用简称、再用全称请求时，会命中旧缓存而显示上一次的地名。
   */
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return ok(
      { ...(cached.data as object), location },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  try {
    const snapshot = await fetchWeather(location);
    cache.set(cacheKey, { data: snapshot, cachedAt: Date.now() });

    return ok(snapshot, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const weatherError = toWeatherError(error);
    return fail(weatherError.message, weatherError.status);
  }
}
