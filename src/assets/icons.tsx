/**
 * 图标组件 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 *
 * 每个图标一个组件，直接从 '@/assets' 引入即可，不需要再包一层：
 *   import { IconMoon } from '@/assets';
 *   <IconMoon size={17} className="text-ink" />
 *
 * 需要按数据里的名字动态取图标时（如天气码 → 图标），用 `Icon`：
 *   <Icon name={condition.icon} size={54} />
 *
 * 所有组件共用 public/assets/sprite.svg，一次请求、浏览器缓存复用，
 * 颜色走 currentColor，换主题不用另出图标。
 */
import type { SVGProps } from 'react';
import { ICONS, iconHref, type IconName } from './manifest';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'name'> {
  size?: number;
}

export function Icon({ name, size = 16, className, ...rest }: IconProps & { name: IconName }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className}
      {...rest}
    >
      <use href={iconHref(name)} />
    </svg>
  );
}

export function IconArrowUpRight(props: IconProps) {
  return <Icon name={ICONS.IconArrowUpRight} {...props} />;
}

export function IconDroplet(props: IconProps) {
  return <Icon name={ICONS.IconDroplet} {...props} />;
}

export function IconLocate(props: IconProps) {
  return <Icon name={ICONS.IconLocate} {...props} />;
}

export function IconMoon(props: IconProps) {
  return <Icon name={ICONS.IconMoon} {...props} />;
}

export function IconSun(props: IconProps) {
  return <Icon name={ICONS.IconSun} {...props} />;
}

export function WeatherClearDay(props: IconProps) {
  return <Icon name={ICONS.WeatherClearDay} {...props} />;
}

export function WeatherClearNight(props: IconProps) {
  return <Icon name={ICONS.WeatherClearNight} {...props} />;
}

export function WeatherCloudy(props: IconProps) {
  return <Icon name={ICONS.WeatherCloudy} {...props} />;
}

export function WeatherDrizzle(props: IconProps) {
  return <Icon name={ICONS.WeatherDrizzle} {...props} />;
}

export function WeatherFog(props: IconProps) {
  return <Icon name={ICONS.WeatherFog} {...props} />;
}

export function WeatherMostlyClear(props: IconProps) {
  return <Icon name={ICONS.WeatherMostlyClear} {...props} />;
}

export function WeatherPartlyCloudy(props: IconProps) {
  return <Icon name={ICONS.WeatherPartlyCloudy} {...props} />;
}

export function WeatherRain(props: IconProps) {
  return <Icon name={ICONS.WeatherRain} {...props} />;
}

export function WeatherSnow(props: IconProps) {
  return <Icon name={ICONS.WeatherSnow} {...props} />;
}

export function WeatherSnowflake(props: IconProps) {
  return <Icon name={ICONS.WeatherSnowflake} {...props} />;
}

export function WeatherThunder(props: IconProps) {
  return <Icon name={ICONS.WeatherThunder} {...props} />;
}

export function WeatherUnknown(props: IconProps) {
  return <Icon name={ICONS.WeatherUnknown} {...props} />;
}
