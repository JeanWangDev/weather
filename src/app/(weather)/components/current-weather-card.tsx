'use client';

import { svgIcon } from '@/assets';
import { describeWeather } from '@/lib/weather-codes';
import type { WeatherSnapshot } from '@/types/weather';
import { formatClock, formatCoordinate, formatPlaceName, formatWindDirection } from '@/lib/format';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/cn';

interface CurrentWeatherCardProps {
  data: WeatherSnapshot;
}

/**
 * 当前天气主卡片：纯展示，数据由 useWeatherStore 提供。
 *
 * 备注：指标列表是「有则显示、无则隐藏」——compact 端点不提供体感温度，
 * 早期版本为了凑满 2×2 网格而补假值，评审时被判为"数据造假"，现已改为缺字段直接不渲染。
 * 「今日 17° ~ 18°」只覆盖剩余时段（上游序列从当前时刻起算），不是完整的当日极值。
 */
export default function CurrentWeatherCard({ data }: CurrentWeatherCardProps) {
  const { locale, t } = useI18n();
  const { current, location, units } = data;
  const condition = describeWeather(current.weatherCode, current.isDay, locale);
  const Glyph = svgIcon(condition.icon);

  const metrics = [
    ...(typeof current.apparentTemperature === 'number'
      ? [
          {
            label: t('metricFeelsLike'),
            value: `${Math.round(current.apparentTemperature)}${units.temperature}`,
          },
        ]
      : []),
    { label: t('metricHumidity'), value: `${Math.round(current.humidity)}%` },
    {
      label: t('metricWind'),
      value: `${Math.round(current.windSpeed)} ${units.windSpeed} · ${formatWindDirection(
        current.windDirection,
        locale,
      )}`,
    },
    { label: t('metricPressure'), value: `${Math.round(current.pressure)} ${units.pressure}` },
    {
      label: t('metricPrecip'),
      value: `${current.precipitation.toFixed(1)} ${units.precipitation}`,
    },
  ];

  const threeColumns = metrics.length % 3 === 0;

  return (
    <section
      className="animate-fadeUp rounded-card border border-line bg-gradient-to-br from-surface-strong to-surface p-7 pb-[22px] shadow-card backdrop-blur-xl max-sm:p-[18px]"
      aria-label={location.name}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[22px] font-bold tracking-[0.01em]">{location.name}</h2>
          <p className="mt-1.5 text-xs text-ink-faint">
            {[location.admin1, location.country].filter(Boolean).join(' · ') || '—'} ·{' '}
            {formatCoordinate(location.latitude, location.longitude)}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-pill bg-tile px-3 py-1.5 text-xs text-ink-muted">
          {t('localTime', { time: formatClock(current.time) })}
        </span>
      </header>

      <div className="mb-1.5 mt-[22px] flex items-center gap-5 max-sm:flex-wrap max-sm:gap-3.5">
        <Glyph
          width={48}
          height={48}
          className="[filter:drop-shadow(0_8px_24px_var(--accent-soft))] max-sm:h-11 max-sm:w-11"
        />
        <div className="flex items-baseline gap-1">
          <span className="text-[64px] font-bold leading-none tracking-[-0.03em] max-sm:text-[52px]">
            {Math.round(current.temperature)}
          </span>
          <span className="text-lg font-medium text-ink-muted">{units.temperature}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-[17px] font-semibold">{condition.label}</p>
          <p className="m-0 text-xs text-ink-faint">
            {t('todayRange', {
              min: Math.round(data.daily[0]?.temperatureMin ?? current.temperature),
              max: Math.round(data.daily[0]?.temperatureMax ?? current.temperature),
            })}
          </p>
        </div>
      </div>

      <dl className={cn('mt-[22px] grid grid-cols-2 gap-2.5', threeColumns && 'md:grid-cols-3')}>
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-tile border border-line bg-tile px-3.5 py-3">
            <dt className="mb-1 text-[11px] tracking-[0.04em] text-ink-faint">{metric.label}</dt>
            <dd className="m-0 text-sm font-semibold">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-[18px] text-[11px] text-ink-faint">
        {t('provider', { provider: data.provider })} ·{' '}
        {t('fullPlace', { place: formatPlaceName(location) })}
      </p>
    </section>
  );
}
