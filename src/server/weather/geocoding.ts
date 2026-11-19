/** 地点搜索：Open-Meteo Geocoding API（免费、无需 Key、支持中英文地名） */
import { UPSTREAM } from '@/config/api';
import type { Locale } from '@/config/i18n';
import type { GeoLocation } from '@/types/weather';
import { WeatherError } from '@/server/weather-error';

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    population?: number;
  }>;
}

export async function searchLocations(query: string, lang: Locale = 'zh'): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${UPSTREAM.geocoding}?${new URLSearchParams({
    name: trimmed,
    count: String(UPSTREAM.geocodeLimit),
    language: lang,
    format: 'json',
  }).toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(UPSTREAM.timeoutMs),
    });
  } catch (error) {
    throw new WeatherError('地点搜索服务连接失败，请检查网络', 502, { cause: error });
  }

  if (!response.ok) {
    throw new WeatherError('地点搜索暂时不可用，请稍后重试', 502);
  }

  let payload: GeocodingResponse;
  try {
    payload = (await response.json()) as GeocodingResponse;
  } catch (error) {
    throw new WeatherError('地点数据解析失败', 502, { cause: error });
  }

  return (
    (payload.results ?? [])
      .map((item) => ({
        id: item.id,
        name: item.name,
        country: item.country ?? '',
        admin1: item.admin1,
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone ?? 'UTC',
        population: item.population,
      }))
      // 上游按字符串匹配度排序，同名小地名会排在前面；按人口重排让大城市优先
      .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
      .slice(0, UPSTREAM.geocodeResultLimit)
  );
}
