/**
 * WMO 天气代码 → 文案 / 图标（数据源无关，只认 WMO code）。
 * 文案随 locale 变化，图标为 emoji（昼夜区分由 isDay 决定）。
 */
import type { Locale } from '@/config/i18n';

interface WeatherCodeMeta {
  zh: string;
  en: string;
  dayIcon: string;
  nightIcon: string;
}

const CODE_MAP: Record<number, WeatherCodeMeta> = {
  0: { zh: '晴', en: 'Clear', dayIcon: '☀️', nightIcon: '🌙' },
  1: { zh: '大部晴朗', en: 'Mostly clear', dayIcon: '🌤️', nightIcon: '🌙' },
  2: { zh: '局部多云', en: 'Partly cloudy', dayIcon: '⛅', nightIcon: '☁️' },
  3: { zh: '阴', en: 'Overcast', dayIcon: '☁️', nightIcon: '☁️' },
  45: { zh: '雾', en: 'Fog', dayIcon: '🌫️', nightIcon: '🌫️' },
  48: { zh: '雾凇', en: 'Rime fog', dayIcon: '🌫️', nightIcon: '🌫️' },
  51: { zh: '小毛毛雨', en: 'Light drizzle', dayIcon: '🌦️', nightIcon: '🌧️' },
  53: { zh: '毛毛雨', en: 'Drizzle', dayIcon: '🌦️', nightIcon: '🌧️' },
  55: { zh: '大毛毛雨', en: 'Heavy drizzle', dayIcon: '🌦️', nightIcon: '🌧️' },
  56: { zh: '冻毛毛雨', en: 'Freezing drizzle', dayIcon: '🌧️', nightIcon: '🌧️' },
  57: { zh: '强冻毛毛雨', en: 'Dense freezing drizzle', dayIcon: '🌧️', nightIcon: '🌧️' },
  61: { zh: '小雨', en: 'Light rain', dayIcon: '🌦️', nightIcon: '🌧️' },
  63: { zh: '中雨', en: 'Rain', dayIcon: '🌧️', nightIcon: '🌧️' },
  65: { zh: '大雨', en: 'Heavy rain', dayIcon: '🌧️', nightIcon: '🌧️' },
  66: { zh: '冻雨', en: 'Freezing rain', dayIcon: '🌧️', nightIcon: '🌧️' },
  67: { zh: '强冻雨', en: 'Heavy freezing rain', dayIcon: '🌧️', nightIcon: '🌧️' },
  71: { zh: '小雪', en: 'Light snow', dayIcon: '🌨️', nightIcon: '🌨️' },
  73: { zh: '中雪', en: 'Snow', dayIcon: '🌨️', nightIcon: '🌨️' },
  75: { zh: '大雪', en: 'Heavy snow', dayIcon: '❄️', nightIcon: '❄️' },
  77: { zh: '雪粒', en: 'Snow grains', dayIcon: '🌨️', nightIcon: '🌨️' },
  80: { zh: '小阵雨', en: 'Light showers', dayIcon: '🌦️', nightIcon: '🌧️' },
  81: { zh: '阵雨', en: 'Showers', dayIcon: '🌧️', nightIcon: '🌧️' },
  82: { zh: '强阵雨', en: 'Violent showers', dayIcon: '⛈️', nightIcon: '⛈️' },
  85: { zh: '小阵雪', en: 'Light snow showers', dayIcon: '🌨️', nightIcon: '🌨️' },
  86: { zh: '强阵雪', en: 'Heavy snow showers', dayIcon: '❄️', nightIcon: '❄️' },
  95: { zh: '雷暴', en: 'Thunderstorm', dayIcon: '⛈️', nightIcon: '⛈️' },
  96: { zh: '雷暴伴小冰雹', en: 'Thunderstorm with hail', dayIcon: '⛈️', nightIcon: '⛈️' },
  99: { zh: '雷暴伴大冰雹', en: 'Thunderstorm with heavy hail', dayIcon: '⛈️', nightIcon: '⛈️' },
};

const FALLBACK: WeatherCodeMeta = {
  zh: '未知天气',
  en: 'Unknown',
  dayIcon: '🌡️',
  nightIcon: '🌡️',
};

export function describeWeather(
  code: number,
  isDay = true,
  locale: Locale = 'zh',
): { label: string; icon: string } {
  const meta = CODE_MAP[code] ?? FALLBACK;
  return { label: meta[locale], icon: isDay ? meta.dayIcon : meta.nightIcon };
}
