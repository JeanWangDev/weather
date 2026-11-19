/**
 * 逆地理编码（坐标 → 地名），供「使用我的位置」使用。
 *
 * 选型说明：Nominatim / api.bigdatacloud.net / Open-Meteo（无反向接口）在本机网络均不可用，
 * us1.api-bdc.net 可达且支持 zh/en，故取它。
 * 时区上游不给，由调用方传入（定位场景里浏览器时区就是用户所在时区，准确度最高）。
 */
import { UPSTREAM } from '@/config/api';
import type { Locale } from '@/config/i18n';
import type { GeoLocation } from '@/types/weather';
import { WeatherError } from '@/server/weather-error';

interface ReverseResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
  localityInfo?: {
    administrative?: Array<{ name: string; adminLevel?: number; geonameId?: number }>;
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  lang: Locale,
  timezone: string,
): Promise<GeoLocation> {
  const url = `${UPSTREAM.reverseGeocoding}?${new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: lang,
  }).toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(UPSTREAM.timeoutMs),
      next: { revalidate: 3600 },
    });
  } catch (error) {
    throw new WeatherError('定位解析服务连接失败，请手动搜索城市', 502, { cause: error });
  }

  if (!response.ok) {
    throw new WeatherError('定位解析暂时不可用，请手动搜索城市', 502);
  }

  let payload: ReverseResponse;
  try {
    payload = (await response.json()) as ReverseResponse;
  } catch (error) {
    throw new WeatherError('定位数据解析失败', 502, { cause: error });
  }

  const name = payload.city || payload.locality;
  if (!name) {
    throw new WeatherError('该坐标附近没有可用地名，请手动搜索城市', 404);
  }

  // geonameId 用于和搜索接口的结果保持同一套 id 语义（命中缓存时可复用天气数据）
  const match = payload.localityInfo?.administrative?.find(
    (item) => item.name === name || item.name === payload.city,
  );

  return {
    id: match?.geonameId ?? 0,
    name,
    country: payload.countryName ?? '',
    admin1: payload.principalSubdivision,
    latitude,
    longitude,
    timezone,
  };
}
