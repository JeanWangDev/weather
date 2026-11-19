/** 接口地址与端点常量（对齐 Velora-web 的 config/api） */
import { API_BASE_PATH } from './env';

/**
 * 自家 Route Handler 的路径表（客户端只认这几个端点）。
 * 统一从这里取，避免字符串散落在 services / components 里。
 */
export const API_ENDPOINTS = {
  geocode: `${API_BASE_PATH}/geocode`,
  weather: `${API_BASE_PATH}/weather`,
  location: `${API_BASE_PATH}/location`,
  overview: `${API_BASE_PATH}/overview`,
} as const;

/** 上游数据源（仅在服务端使用，不进客户端 bundle） */
export const UPSTREAM = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  forecast: 'https://api.met.no/weatherapi/locationforecast/2.0/compact',
  // 逆地理编码：主域名 api-bigdatacloud.net 实测不可达，us1 节点可达且支持 zh/en
  reverseGeocoding: 'https://us1.api-bdc.net/data/reverse-geocode-client',
  userAgent: 'weather-takehome-app/1.0 (educational project)',
  timeoutMs: 8_000,
  geocodeLimit: 10,
  geocodeResultLimit: 6,
} as const;
