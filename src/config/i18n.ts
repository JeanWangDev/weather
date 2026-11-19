/**
 * 轻量 i18n 词典。
 *
 * 不引 next-intl / i18next 的理由：只有两种语言、一个页面，
 * 引入框架会把「路由段、中间件、服务端渲染 locale 传递」一整套复杂度带进来。
 * 这里用类型约束兜底：`en` 必须与 `zh` 同构，漏翻一个 key 会在 `tsc` 报错。
 * 文案里的 `{var}` 占位交给 `format` 替换，不做函数值，保证词典可序列化。
 */

export type Locale = 'zh' | 'en';

const zh = {
  kicker: 'Weather',
  title: '今天天气怎么样',
  updatedAt: '更新时间 {time} · 刷新',
  footerSource: '数据来源：MET Norway · 地点搜索 Open-Meteo',
  footerStack: 'Next.js · React · TypeScript · Tailwind CSS · Zustand',

  searchPlaceholder: '搜索城市，例如 深圳、東京、New York',
  searchAria: '搜索城市',
  searchClear: '清空搜索',
  searching: '正在搜索…',
  noResults: '没有找到「{query}」，换个关键词试试',
  resultsAria: '地点搜索结果',

  locate: '使用我的位置',
  locationDenied: '定位权限被拒绝，可在浏览器设置里允许后重试',
  locationUnavailable: '当前环境拿不到位置信息，请手动搜索城市',
  locationTimeout: '定位超时，请重试或手动搜索',
  locationFailed: '定位失败，请重试或手动搜索城市',

  popular: '热门城市',

  emptyTitle: '想看哪里的天气？',
  emptyHint: '在上方搜索城市名，或直接点一个热门的：',

  localTime: '当地时间 {time}',
  todayRange: '今日 {min}° ~ {max}°',
  metricFeelsLike: '体感温度',
  metricHumidity: '相对湿度',
  metricWind: '风速',
  metricPressure: '气压',
  metricPrecip: '近 1 小时降水',
  provider: '数据来源 {provider}',
  fullPlace: '完整地点：{place}',

  hourlyTitle: '未来 24 小时',
  hourlyHint: '降水 · 温度',
  now: '现在',

  trendTitle: '温度趋势',
  trendHint: '逐小时 · 悬停看细节',
  trendLow: '低',
  trendHigh: '高',

  forecastTitle: '未来 7 天',
  forecastHint: '最低 — 最高',
  today: '今天',

  loading: '正在获取 {place} 的天气…',
  errorTitle: '天气加载失败',
  retry: '重新获取',

  errorNetwork: '网络连接失败，请检查网络后重试',
  errorTimeout: '请求超时，请稍后重试',
  errorBadRequest: '请求参数有误，请重新选择城市',
  errorNotFound: '该地点暂无可用天气数据',
  errorRateLimited: '请求太频繁了，请稍后再试',
  errorServer: '天气服务暂时不可用，请稍后重试',
  errorGeneric: '天气加载失败，请重试',

  mapAria: '位置地图',
  openMap: '打开地图',
  mapAttribution: '底图 高德地图',
  mapUnavailable: '该地区暂无底图预览，可点「打开地图」查看',
  rainNone: '未来两小时预计无降水，可以放心出门',
  rainSome: '未来两小时可能有降水，记得带伞',

  themeToLight: '切换到浅色主题',
  themeToDark: '切换到深色主题',
  languageLabel: '语言',
};

type Dictionary = typeof zh;

const en: Dictionary = {
  kicker: 'Weather',
  title: 'How is the weather today',
  updatedAt: 'Updated {time} · Refresh',
  footerSource: 'Data: MET Norway · Geocoding: Open-Meteo',
  footerStack: 'Next.js · React · TypeScript · Tailwind CSS · Zustand',

  searchPlaceholder: 'Search a city, e.g. Shenzhen, Tokyo, New York',
  searchAria: 'Search city',
  searchClear: 'Clear search',
  searching: 'Searching…',
  noResults: 'No match for “{query}”, try another keyword',
  resultsAria: 'Location search results',

  locate: 'Use my location',
  locationDenied: 'Location permission denied. Allow it in browser settings and retry',
  locationUnavailable: 'Location is unavailable here, please search a city instead',
  locationTimeout: 'Location request timed out, retry or search manually',
  locationFailed: 'Failed to locate, retry or search a city',

  popular: 'Popular',

  emptyTitle: 'Which city are you curious about?',
  emptyHint: 'Search above, or start with a popular one:',

  localTime: 'Local time {time}',
  todayRange: 'Today {min}° ~ {max}°',
  metricFeelsLike: 'Feels like',
  metricHumidity: 'Humidity',
  metricWind: 'Wind',
  metricPressure: 'Pressure',
  metricPrecip: 'Precip (1h)',
  provider: 'Source: {provider}',
  fullPlace: 'Location: {place}',

  hourlyTitle: 'Next 24 hours',
  hourlyHint: 'Precip · Temp',
  now: 'Now',

  trendTitle: 'Temperature trend',
  trendHint: 'Hourly · hover for detail',
  trendLow: 'Low',
  trendHigh: 'High',

  forecastTitle: 'Next 7 days',
  forecastHint: 'Low — High',
  today: 'Today',

  loading: 'Fetching weather for {place}…',
  errorTitle: 'Weather unavailable',
  retry: 'Try again',

  errorNetwork: 'Network failed, check your connection and retry',
  errorTimeout: 'Request timed out, please retry later',
  errorBadRequest: 'Invalid request, please pick a city again',
  errorNotFound: 'No weather data available for this place',
  errorRateLimited: 'Too many requests, please retry later',
  errorServer: 'Weather service is temporarily unavailable',
  errorGeneric: 'Failed to load weather, please retry',

  mapAria: 'Location map',
  openMap: 'Open map',
  mapAttribution: 'Basemap © Amap',
  mapUnavailable: 'No basemap preview for this region — open in Maps',
  rainNone: 'No rain expected in the next 2 hours',
  rainSome: 'Rain possible within 2 hours — bring an umbrella',

  themeToLight: 'Switch to light theme',
  themeToDark: 'Switch to dark theme',
  languageLabel: 'Language',
};

export const dictionaries: Record<Locale, Dictionary> = { zh, en };

export type TranslationKey = keyof Dictionary;

export const LOCALES: Array<{ value: Locale; label: string; short: string }> = [
  { value: 'zh', label: '中文', short: '中' },
  { value: 'en', label: 'English', short: 'EN' },
];

/** 把 `{var}` 占位替换成实际值 */
export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** HTTP 状态 / 客户端错误码 → 本地化错误文案 key */
export function resolveErrorKey(status: number): TranslationKey {
  if (status === 0) return 'errorNetwork';
  if (status === 408 || status === 504) return 'errorTimeout';
  if (status === 400 || status === 422) return 'errorBadRequest';
  if (status === 404) return 'errorNotFound';
  if (status === 429) return 'errorRateLimited';
  if (status >= 500) return 'errorServer';
  return 'errorGeneric';
}

/** 日期/时间格式化用的 BCP 47 标签 */
export const INTL_LOCALE: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en-US',
};
