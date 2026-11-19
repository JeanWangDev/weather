/**
 * 图标注册表 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 * 源文件：public/assets/svg/*.svg（文件名即属性名，大驼峰）
 * 重新生成：yarn assets
 *
 * 用法：
 *   import { SvgPor } from '@/assets';
 *   <SvgPor.IconMoon width={17} height={17} className="text-ink" />
 *
 * 或按数据里的名字动态取（类属性不能直接用变量索引，用同名 helper）：
 *   const Glyph = svgIcon(condition.icon);
 *   <Glyph width={48} height={48} />
 */
import IconArrowUpRight from '@public/assets/svg/IconArrowUpRight.svg';
import IconDroplet from '@public/assets/svg/IconDroplet.svg';
import IconLocate from '@public/assets/svg/IconLocate.svg';
import IconMoon from '@public/assets/svg/IconMoon.svg';
import IconSun from '@public/assets/svg/IconSun.svg';
import WeatherClearDay from '@public/assets/svg/WeatherClearDay.svg';
import WeatherClearNight from '@public/assets/svg/WeatherClearNight.svg';
import WeatherCloudy from '@public/assets/svg/WeatherCloudy.svg';
import WeatherDrizzle from '@public/assets/svg/WeatherDrizzle.svg';
import WeatherFog from '@public/assets/svg/WeatherFog.svg';
import WeatherMostlyClear from '@public/assets/svg/WeatherMostlyClear.svg';
import WeatherPartlyCloudy from '@public/assets/svg/WeatherPartlyCloudy.svg';
import WeatherRain from '@public/assets/svg/WeatherRain.svg';
import WeatherSnow from '@public/assets/svg/WeatherSnow.svg';
import WeatherSnowflake from '@public/assets/svg/WeatherSnowflake.svg';
import WeatherThunder from '@public/assets/svg/WeatherThunder.svg';
import WeatherUnknown from '@public/assets/svg/WeatherUnknown.svg';

/** 名字 → 组件映射，供「按数据里的图标名动态取」使用 */
const REGISTRY = {
  IconArrowUpRight,
  IconDroplet,
  IconLocate,
  IconMoon,
  IconSun,
  WeatherClearDay,
  WeatherClearNight,
  WeatherCloudy,
  WeatherDrizzle,
  WeatherFog,
  WeatherMostlyClear,
  WeatherPartlyCloudy,
  WeatherRain,
  WeatherSnow,
  WeatherSnowflake,
  WeatherThunder,
  WeatherUnknown,
} as const;

export class SvgPor {
  static IconArrowUpRight = IconArrowUpRight;
  static IconDroplet = IconDroplet;
  static IconLocate = IconLocate;
  static IconMoon = IconMoon;
  static IconSun = IconSun;
  static WeatherClearDay = WeatherClearDay;
  static WeatherClearNight = WeatherClearNight;
  static WeatherCloudy = WeatherCloudy;
  static WeatherDrizzle = WeatherDrizzle;
  static WeatherFog = WeatherFog;
  static WeatherMostlyClear = WeatherMostlyClear;
  static WeatherPartlyCloudy = WeatherPartlyCloudy;
  static WeatherRain = WeatherRain;
  static WeatherSnow = WeatherSnow;
  static WeatherSnowflake = WeatherSnowflake;
  static WeatherThunder = WeatherThunder;
  static WeatherUnknown = WeatherUnknown;
}

/** 图标名（= 类属性名 = svg 文件名）。拼错即编译报错 */
export type SvgIconName = keyof typeof REGISTRY;

/** 动态取图标：const Glyph = svgIcon(condition.icon) */
export function svgIcon(name: SvgIconName) {
  return REGISTRY[name];
}
