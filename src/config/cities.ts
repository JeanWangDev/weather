/**
 * 热门城市推荐：按语言各给一套。
 * 放在 config 而不是组件里，是因为「推荐哪些城市」属于产品配置，
 * 后续想做运营位/个性化，只改这里，不动组件。
 */
import type { Locale } from './i18n';

export const POPULAR_CITIES: Record<Locale, string[]> = {
  zh: ['北京', '上海', '深圳', '巴黎', '東京', 'New York'],
  en: ['Beijing', 'Shanghai', 'Shenzhen', 'Paris', 'Tokyo', 'New York'],
};

/** 首次进入的默认城市（无历史记录时使用，避免一屏空白） */
export const DEFAULT_CITY: Record<Locale, string> = {
  zh: '深圳',
  en: 'Shenzhen',
};
