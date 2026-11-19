import { API_ENDPOINTS } from '@/config/api';
import type { Locale } from '@/config/i18n';
import type { CityOverview, GeoLocation, WeatherSnapshot } from '@/types/weather';
import { apiClient } from './api-client';

/**
 * 天气服务（对齐 Velora-web 的 MarketDataService：静态类 + 按端点分组的方法）。
 * 组件/hooks 不直接碰 URL 与参数拼接，只调这里的方法。
 */
export class WeatherService {
  /** 地点搜索：空结果返回空数组，属于正常业务分支 */
  static searchLocations(query: string, locale: Locale = 'zh', signal?: AbortSignal) {
    return apiClient.sendRequest<{ locations: GeoLocation[] }>({
      url: API_ENDPOINTS.geocode,
      params: { q: query.trim(), lang: locale },
      signal,
    });
  }

  /** 一次请求拿到当前天气 + 24h + 7d */
  static getSnapshot(location: GeoLocation, signal?: AbortSignal) {
    return apiClient.sendRequest<WeatherSnapshot>({
      url: API_ENDPOINTS.weather,
      params: {
        id: location.id,
        lat: location.latitude,
        lon: location.longitude,
        name: location.name,
        country: location.country,
        admin1: location.admin1,
        timezone: location.timezone,
      },
      signal,
    });
  }

  /** 推荐城市概览：一次拿到多个城市的当前温度（头部胶囊） */
  static getCityOverview(names: string[], locale: Locale = 'zh', signal?: AbortSignal) {
    return apiClient.sendRequest<{ items: CityOverview[] }>({
      url: API_ENDPOINTS.overview,
      params: { cities: names.join(','), lang: locale },
      signal,
    });
  }

  /** 坐标 → 地名（定位功能用，lang 与界面语言一致） */
  static reverseGeocode(latitude: number, longitude: number, locale: Locale, signal?: AbortSignal) {
    const timezone =
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

    return apiClient.sendRequest<GeoLocation>({
      url: API_ENDPOINTS.location,
      params: { lat: latitude, lon: longitude, tz: timezone, lang: locale },
      signal,
    });
  }
}
