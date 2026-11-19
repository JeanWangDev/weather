'use client';

import { describeWeather } from '@/lib/weather-codes';
import type { HourlyPoint } from '@/types/weather';
import { formatClock } from '@/lib/format';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/cn';

interface HourlyStripProps {
  hourly: HourlyPoint[];
}

/**
 * 未来 24 小时：横向滚动。
 *
 * 备注：不引 carousel 组件库，用原生 `overflow-x-auto` + `no-scrollbar`，
 * 桌面端可滚轮横向、移动端直接划；第一格固定标「现在」并高亮，避免用户误读时间轴。
 */
export default function HourlyStrip({ hourly }: HourlyStripProps) {
  const { locale, t } = useI18n();

  if (hourly.length === 0) return null;

  return (
    <section className="panel px-[22px] py-5 pb-[18px]" aria-label={t('hourlyTitle')}>
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-sm font-semibold tracking-[0.02em]">{t('hourlyTitle')}</h3>
        <span className="text-[11px] text-ink-faint">{t('hourlyHint')}</span>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {hourly.map((point, index) => {
          const condition = describeWeather(point.weatherCode, true, locale);
          const isNow = index === 0;

          return (
            <div
              key={point.time}
              className={cn(
                'flex w-[62px] shrink-0 flex-col items-center gap-1.5 rounded-tile border px-1.5 py-3 transition-colors',
                isNow ? 'border-accent bg-accent-soft' : 'border-transparent bg-tile hover:bg-tile-strong',
              )}
            >
              <span className="text-[11px] text-ink-muted">
                {isNow ? t('now') : formatClock(point.time)}
              </span>
              <span className="text-xl leading-none" aria-hidden>
                {condition.icon}
              </span>
              <span className="text-[15px] font-semibold">{Math.round(point.temperature)}°</span>
              <span className="text-[10px] text-ink-faint">
                {point.precipitation > 0 ? point.precipitation.toFixed(1) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
