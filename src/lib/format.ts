/** 展示层格式化工具（纯函数，无副作用；locale 由调用方传入，默认中文） */
import { INTL_LOCALE, type Locale } from '@/config/i18n';

/** ISO 时间串（2026-11-19T14:00）→ HH:mm，与语言无关 */
export function formatClock(iso: string): string {
  const match = /T(\d{2}:\d{2})/.exec(iso);
  return match ? match[1] : iso;
}

/** 日期串（2026-11-19）→「周三」/「Nov 19」 */
export function formatWeekday(
  date: string,
  locale: Locale = 'zh',
  options: { short?: boolean } = {},
): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString(
    INTL_LOCALE[locale],
    options.short
      ? { weekday: 'short' }
      : { month: locale === 'zh' ? 'long' : 'short', day: 'numeric' },
  );
}

/** 数据更新时间（ISO）→ 本地时钟 */
export function formatUpdatedAt(iso: string, locale: Locale = 'zh'): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;

  return parsed.toLocaleTimeString(INTL_LOCALE[locale], { hour: '2-digit', minute: '2-digit' });
}

/** 风向角度 → 方位（中/英各一套 16 方位标签） */
const WIND_16: Record<Locale, string[]> = {
  zh: [
    '北',
    '东北偏北',
    '东北',
    '东北偏东',
    '东',
    '东南偏东',
    '东南',
    '东南偏南',
    '南',
    '西南偏南',
    '西南',
    '西南偏西',
    '西',
    '西北偏西',
    '西北',
    '西北偏北',
  ],
  en: [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ],
};

export function formatWindDirection(degrees: number, locale: Locale = 'zh'): string {
  return WIND_16[locale][Math.round(degrees / 22.5) % 16] ?? (locale === 'zh' ? '未知' : 'N/A');
}

/** 经纬度展示 */
export function formatCoordinate(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat} · ${lon}`;
}

/** 地点展示名：城市 · 行政区 · 国家 */
export function formatPlaceName(location: {
  name: string;
  admin1?: string;
  country: string;
}): string {
  return [location.name, location.admin1, location.country].filter(Boolean).join(' · ');
}

/** 人口简写，用于区分同名城市 */
export function formatPopulation(population?: number, locale: Locale = 'zh'): string | null {
  if (!population || population <= 0) return null;

  if (locale === 'en') {
    if (population >= 1_000_000)
      return `${(population / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (population >= 1_000) return `${Math.round(population / 1_000)}K`;
    return String(population);
  }

  if (population >= 10_000) return `${Math.round(population / 10_000)} 万人`;
  return `${population} 人`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
