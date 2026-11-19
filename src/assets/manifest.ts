/**
 * 资源清单 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 * 源文件：public/assets/svg/*.svg（合成雪碧图）、public/assets/images/*（位图）
 * 重新生成：yarn assets
 */

/** 雪碧图地址：所有图标共用一次请求，靠 <use href="#id"> 复用 */
export const SPRITE_URL = '/assets/sprite.svg';

/** 图标清单。键与 symbol id 都是大驼峰，拼错即类型错误 */
export const ICONS = {
  IconArrowUpRight: 'IconArrowUpRight',
  IconDroplet: 'IconDroplet',
  IconLocate: 'IconLocate',
  IconMoon: 'IconMoon',
  IconSun: 'IconSun',
  WeatherClearDay: 'WeatherClearDay',
  WeatherClearNight: 'WeatherClearNight',
  WeatherCloudy: 'WeatherCloudy',
  WeatherDrizzle: 'WeatherDrizzle',
  WeatherFog: 'WeatherFog',
  WeatherMostlyClear: 'WeatherMostlyClear',
  WeatherPartlyCloudy: 'WeatherPartlyCloudy',
  WeatherRain: 'WeatherRain',
  WeatherSnow: 'WeatherSnow',
  WeatherSnowflake: 'WeatherSnowflake',
  WeatherThunder: 'WeatherThunder',
  WeatherUnknown: 'WeatherUnknown',
} as const;

export type IconName = keyof typeof ICONS;

/** 位图清单，附带原始像素尺寸（用于设置宽高比，避免加载前布局抖动） */
export const IMAGES = {
  // 暂无位图：把 .png/.jpg/.webp 放进 public/assets/images/ 后重跑 yarn assets
} as const;

export type ImageName = keyof typeof IMAGES;

/** 生成 <use> 需要的片段：/assets/sprite.svg#IconMoon */
export function iconHref(name: IconName): string {
  return `${SPRITE_URL}#${ICONS[name]}`;
}
