/**
 * WMO 天气代码 → 文案 / 图标（数据源无关，只认 WMO code）。
 *
 * 图标不是 emoji，而是 public/assets/svg 里的图标名（SvgIconName）：
 * ① 颜色跟随主题（currentColor），深浅色下都不用另配一套资源；
 * ② 名字有类型约束，写错编译就报，不会出现「某个天气码没图标」的静默空白；
 * ③ 昼夜差异用两个不同图标表达，而不是同一个 emoji 换个色。
 */
import type { SvgIconName } from '@/assets';
import type { Locale } from '@/config/i18n';

interface WeatherCodeMeta {
  zh: string;
  en: string;
  dayIcon: SvgIconName;
  nightIcon: SvgIconName;
}

const CODE_MAP: Record<number, WeatherCodeMeta> = {
  0: { zh: '晴', en: 'Clear', dayIcon: 'WeatherClearDay', nightIcon: 'WeatherClearNight' },
  1: {
    zh: '大部晴朗',
    en: 'Mostly clear',
    dayIcon: 'WeatherMostlyClear',
    nightIcon: 'WeatherClearNight',
  },
  2: {
    zh: '局部多云',
    en: 'Partly cloudy',
    dayIcon: 'WeatherPartlyCloudy',
    nightIcon: 'WeatherCloudy',
  },
  3: { zh: '阴', en: 'Overcast', dayIcon: 'WeatherCloudy', nightIcon: 'WeatherCloudy' },
  45: { zh: '雾', en: 'Fog', dayIcon: 'WeatherFog', nightIcon: 'WeatherFog' },
  48: { zh: '雾凇', en: 'Rime fog', dayIcon: 'WeatherFog', nightIcon: 'WeatherFog' },
  51: {
    zh: '小毛毛雨',
    en: 'Light drizzle',
    dayIcon: 'WeatherDrizzle',
    nightIcon: 'WeatherDrizzle',
  },
  53: { zh: '毛毛雨', en: 'Drizzle', dayIcon: 'WeatherDrizzle', nightIcon: 'WeatherDrizzle' },
  55: {
    zh: '大毛毛雨',
    en: 'Heavy drizzle',
    dayIcon: 'WeatherDrizzle',
    nightIcon: 'WeatherDrizzle',
  },
  56: {
    zh: '冻毛毛雨',
    en: 'Freezing drizzle',
    dayIcon: 'WeatherDrizzle',
    nightIcon: 'WeatherRain',
  },
  57: {
    zh: '强冻毛毛雨',
    en: 'Dense freezing drizzle',
    dayIcon: 'WeatherDrizzle',
    nightIcon: 'WeatherRain',
  },
  61: { zh: '小雨', en: 'Light rain', dayIcon: 'WeatherDrizzle', nightIcon: 'WeatherRain' },
  63: { zh: '中雨', en: 'Rain', dayIcon: 'WeatherRain', nightIcon: 'WeatherRain' },
  65: { zh: '大雨', en: 'Heavy rain', dayIcon: 'WeatherRain', nightIcon: 'WeatherRain' },
  66: { zh: '冻雨', en: 'Freezing rain', dayIcon: 'WeatherRain', nightIcon: 'WeatherRain' },
  67: { zh: '强冻雨', en: 'Heavy freezing rain', dayIcon: 'WeatherRain', nightIcon: 'WeatherRain' },
  71: { zh: '小雪', en: 'Light snow', dayIcon: 'WeatherSnow', nightIcon: 'WeatherSnow' },
  73: { zh: '中雪', en: 'Snow', dayIcon: 'WeatherSnow', nightIcon: 'WeatherSnow' },
  75: {
    zh: '大雪',
    en: 'Heavy snow',
    dayIcon: 'WeatherSnowflake',
    nightIcon: 'WeatherSnowflake',
  },
  77: { zh: '雪粒', en: 'Snow grains', dayIcon: 'WeatherSnow', nightIcon: 'WeatherSnow' },
  80: { zh: '小阵雨', en: 'Light showers', dayIcon: 'WeatherDrizzle', nightIcon: 'WeatherRain' },
  81: { zh: '阵雨', en: 'Showers', dayIcon: 'WeatherRain', nightIcon: 'WeatherRain' },
  82: {
    zh: '强阵雨',
    en: 'Violent showers',
    dayIcon: 'WeatherThunder',
    nightIcon: 'WeatherThunder',
  },
  85: {
    zh: '小阵雪',
    en: 'Light snow showers',
    dayIcon: 'WeatherSnow',
    nightIcon: 'WeatherSnow',
  },
  86: {
    zh: '强阵雪',
    en: 'Heavy snow showers',
    dayIcon: 'WeatherSnowflake',
    nightIcon: 'WeatherSnowflake',
  },
  95: { zh: '雷暴', en: 'Thunderstorm', dayIcon: 'WeatherThunder', nightIcon: 'WeatherThunder' },
  96: {
    zh: '雷暴伴小冰雹',
    en: 'Thunderstorm with hail',
    dayIcon: 'WeatherThunder',
    nightIcon: 'WeatherThunder',
  },
  99: {
    zh: '雷暴伴大冰雹',
    en: 'Thunderstorm with heavy hail',
    dayIcon: 'WeatherThunder',
    nightIcon: 'WeatherThunder',
  },
};

const FALLBACK: WeatherCodeMeta = {
  zh: '未知天气',
  en: 'Unknown',
  dayIcon: 'WeatherUnknown',
  nightIcon: 'WeatherUnknown',
};

export function describeWeather(
  code: number,
  isDay = true,
  locale: Locale = 'zh',
): { label: string; icon: SvgIconName } {
  const meta = CODE_MAP[code] ?? FALLBACK;
  return { label: meta[locale], icon: isDay ? meta.dayIcon : meta.nightIcon };
}
